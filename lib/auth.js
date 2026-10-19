import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { getCitizen } from './db';

const secret = () => {
  const value = process.env.SESSION_SECRET || '';
  if (value.length < 32) throw new Error('SESSION_SECRET কমপক্ষে ৩২ অক্ষরের শক্তিশালী গোপন মান হতে হবে।');
  return value;
};
const sign = (v) => createHmac('sha256', secret()).update(v).digest('hex');

export const hash = (pw) => {
  if (typeof pw !== 'string' || pw.length < 10 || pw.length > 128) throw new Error('পাসওয়ার্ড ১০–১২৮ অক্ষরের হতে হবে।');
  const s = randomBytes(16).toString('hex');
  return `${s}:${scryptSync(pw, s, 64).toString('hex')}`;
};
export const verify = (pw, h) => {
  if (typeof pw !== 'string' || typeof h !== 'string' || pw.length > 128) return false;
  const parts = h.split(':');
  if (parts.length !== 2 || !/^[a-f0-9]{32}$/.test(parts[0]) || !/^[a-f0-9]{128}$/.test(parts[1])) return false;
  try {
    const a = Buffer.from(parts[1], 'hex');
    const b = scryptSync(pw, parts[0], 64);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
};

export function startSession(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) throw new Error('অবৈধ নাগরিক আইডি।');
  const v = `${id}.${Date.now() + 7 * 864e5}`;
  cookies().set('sess', `${v}.${sign(v)}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: 7 * 86400,
  });
}
export const endSession = () => cookies().delete('sess');

export async function currentCitizen() {
  const c = cookies().get('sess')?.value;
  if (!c || c.length > 300) return null;
  const parts = c.split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expiry = Number(exp);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isSafeInteger(expiry) || expiry <= Date.now() || expiry > Date.now() + 7 * 864e5 + 60_000 || !/^[a-f0-9]{64}$/.test(sig)) return null;
  try {
    const expected = Buffer.from(sign(`${id}.${exp}`), 'hex');
    const received = Buffer.from(sig, 'hex');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    return await getCitizen(id);
  } catch { return null; }
}
export async function requireCitizen(next = '/dashboard') {
  const u = await currentCitizen();
  if (!u) redirect('/login?next=' + encodeURIComponent(next));
  return u;
}
export const FIELDS = [['name', 'নাম'], ['mobile', 'মোবাইল নম্বর'], ['father', 'পিতার নাম'], ['mother', 'মাতার নাম'], ['dob', 'জন্ম তারিখ'], ['nid', 'NID / জন্ম নিবন্ধন নম্বর'], ['district', 'জেলা'], ['upazila', 'উপজেলা'], ['union_name', 'ইউনিয়ন'], ['village', 'গ্রাম / মহল্লা'], ['ward', 'ওয়ার্ড নং'], ['post', 'ডাকঘর'], ['photo', 'ছবি']];
export const missing = (u) => FIELDS.filter(([k]) => !u[k]);
export const percent = (u) => Math.round(((FIELDS.length - missing(u).length) / FIELDS.length) * 100);
