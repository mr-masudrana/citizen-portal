import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { getCitizen } from './db';
const secret = () => { if (!process.env.SESSION_SECRET) throw new Error('.env.local-এ SESSION_SECRET সেট করুন'); return process.env.SESSION_SECRET; };
const sign = (v) => createHmac('sha256', secret()).update(v).digest('hex');
export const hash = (pw) => { const s = randomBytes(16).toString('hex'); return `${s}:${scryptSync(pw, s, 64).toString('hex')}`; };
export const verify = (pw, h) => { const [s, k] = h.split(':'); const a = Buffer.from(k, 'hex'), b = scryptSync(pw, s, 64); return a.length === b.length && timingSafeEqual(a, b); };
export function startSession(id) {
  const v = `${id}.${Date.now() + 7 * 864e5}`;
  cookies().set('sess', `${v}.${sign(v)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400 });
}
export const endSession = () => cookies().delete('sess');
export async function currentCitizen() {
  const c = cookies().get('sess')?.value;
  if (!c) return null;
  const [id, exp, sig] = c.split('.');
  if (!sig || Number(exp) < Date.now() || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const good = Buffer.from(sign(`${id}.${exp}`)), got = Buffer.from(sig);
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null;
  return getCitizen(id);
}
export async function requireCitizen(next = '/dashboard') {
  const u = await currentCitizen();
  if (!u) redirect('/login?next=' + encodeURIComponent(next));
  return u;
}
export const FIELDS = [['name', 'নাম'], ['mobile', 'মোবাইল নম্বর'], ['father', 'পিতার নাম'], ['mother', 'মাতার নাম'], ['dob', 'জন্ম তারিখ'], ['nid', 'NID / জন্ম নিবন্ধন নম্বর'], ['district', 'জেলা'], ['upazila', 'উপজেলা'], ['union_name', 'ইউনিয়ন'], ['village', 'গ্রাম / মহল্লা'], ['ward', 'ওয়ার্ড নং'], ['post', 'ডাকঘর'], ['photo', 'ছবি']];
export const missing = (u) => FIELDS.filter(([k]) => !u[k]);
export const percent = (u) => Math.round(((FIELDS.length - missing(u).length) / FIELDS.length) * 100);
