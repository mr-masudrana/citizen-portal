import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { getCitizen } from './db';
const secret = () => { if (!process.env.SESSION_SECRET) throw new Error('.env.local-এ SESSION_SECRET সেট করুন'); return process.env.SESSION_SECRET; };
const hmac = (v) => createHmac('sha256', secret()).update(v).digest('hex');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
export const hash = (pw) => { const s = randomBytes(16).toString('hex'); return `${s}:${scryptSync(pw, s, 64).toString('hex')}`; };
export const verify = (pw, h) => { const [s, k] = h.split(':'); const a = Buffer.from(k, 'hex'), b = scryptSync(pw, s, 64); return a.length === b.length && timingSafeEqual(a, b); };
// সেশনের স্বাক্ষরে পাসওয়ার্ডের অংশ থাকে, তাই পাসওয়ার্ড বদলালে পুরোনো সেশন অকেজো হয়।
const bindS = (u) => u.pass_hash.slice(-12);
export function startSession(u) {
  const v = `${u.id}.${Date.now() + 7 * 864e5}`;
  cookies().set('sess', `${v}.${hmac(`${v}.${bindS(u)}`)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400 });
}
export const endSession = () => cookies().delete('sess');
export async function currentCitizen() {
  const c = cookies().get('sess')?.value;
  if (!c) return null;
  const [id, exp, sig] = c.split('.');
  if (!sig || Number(exp) < Date.now() || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const u = await getCitizen(id);
  return u && same(hmac(`${id}.${exp}.${bindS(u)}`), sig) ? u : null;
}
export async function requireCitizen(next = '/dashboard') {
  const u = await currentCitizen();
  if (!u) redirect('/login?next=' + encodeURIComponent(next));
  return u;
}
// ইমেইলের লিংকের টোকেন। reset টোকেন পাসওয়ার্ডের সঙ্গে, verify টোকেন ইমেইলের সঙ্গে বাঁধা, তাই কাজ হয়ে গেলে বা বদলালে অচল হয়।
const bindT = (kind, u) => (kind === 'reset' ? u.pass_hash : u.email);
export function makeToken(kind, u, hours) {
  const base = `${u.id}.${Date.now() + hours * 36e5}`;
  return `${base}.${hmac(`${kind}.${base}.${bindT(kind, u)}`)}`;
}
export async function readToken(kind, token) {
  const [id, exp, sig] = String(token || '').split('.');
  if (!sig || Number(exp) < Date.now() || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const u = await getCitizen(id);
  return u && bindT(kind, u) && same(hmac(`${kind}.${id}.${exp}.${bindT(kind, u)}`), sig) ? u : null;
}
export const FIELDS = [['name', 'নাম'], ['mobile', 'মোবাইল নম্বর'], ['email', 'ইমেইল'], ['father', 'পিতার নাম'], ['mother', 'মাতার নাম'], ['dob', 'জন্ম তারিখ'], ['nid', 'NID / জন্ম নিবন্ধন নম্বর'], ['division', 'বিভাগ'], ['district', 'জেলা'], ['upazila', 'উপজেলা'], ['union_name', 'ইউনিয়ন'], ['village', 'গ্রাম / মহল্লা'], ['ward', 'ওয়ার্ড নং'], ['post', 'ডাকঘর'], ['photo', 'ছবি']];
export const missing = (u) => FIELDS.filter(([k]) => !u[k]);
export const percent = (u) => Math.round(((FIELDS.length - missing(u).length) / FIELDS.length) * 100);
export const ready = (u) => percent(u) === 100 && !!u.email_verified;
