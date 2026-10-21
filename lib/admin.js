import { cookies, headers } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { getOtp, saveOtp, delOtp, get, patch, getCitizen, patchCitizen } from './db';
import { sendMail } from './mail';
const key = () => `${process.env.SESSION_SECRET || ''}|${process.env.ADMIN_KEY || ''}`;
const mac = (v) => createHmac('sha256', key()).update('admin.' + v).digest('hex');
export const adminConfigured = () => !!process.env.ADMIN_KEY && !!process.env.SESSION_SECRET;
// অ্যাডমিন সেশন ৮ ঘণ্টার, স্বাক্ষরযুক্ত কুকি। প্রতিটি অ্যাডমিন পেজ ও অ্যাকশনে isAdmin() যাচাই হয়।
export function isAdmin() {
  const c = cookies().get('admin')?.value;
  if (!c || !adminConfigured()) return false;
  const [exp, sig] = c.split('.');
  if (!sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(mac(exp)), b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function startAdmin() {
  const exp = String(Date.now() + 8 * 36e5);
  cookies().set('admin', `${exp}.${mac(exp)}`, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 3600 });
}
export const endAdmin = () => cookies().delete('admin');
// লগইনে ভুল চেষ্টা: একই আইপি থেকে ৫ বার ভুল হলে ১৫ মিনিট বন্ধ
const ipKey = () => 'admin:' + (headers().get('x-forwarded-for') || 'local').split(',')[0].trim();
export async function adminLocked() { const r = await getOtp(ipKey()); return !!r && r.attempts >= 5 && new Date(r.expires_at) > new Date(); }
export async function adminFail() {
  const k = ipKey(), r = await getOtp(k), live = r && new Date(r.expires_at) > new Date();
  await saveOtp({ key: k, code_hash: '-', attempts: live ? r.attempts + 1 : 1, expires_at: new Date(Date.now() + 15 * 60000).toISOString(), sent_at: new Date().toISOString(), payload: null });
}
export const adminOk = () => delOtp(ipKey());
export const dt = (iso) => (iso ? new Date(iso).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }) : '—');
const LBL = { approved: 'অনুমোদিত হয়েছে', rejected: 'বাতিল করা হয়েছে' };
// অনুমোদন বা বাতিল করে নাগরিককে ইমেইল জানায়। onlyPending হলে শুধু অপেক্ষমাণ আবেদনে কাজ করে।
export async function decide(no, status, note, onlyPending = false) {
  const a = await get(no);
  if (!a || (onlyPending && a.status !== 'pending')) return false;
  await patch(no, { status, decidedAt: new Date().toISOString(), admin_note: note || null });
  try {
    const c = a.citizen_id || a.filed_by ? await getCitizen(a.citizen_id || a.filed_by) : null;
    if (c?.email) await sendMail(c.email, `আপনার আবেদন ${LBL[status]} – নাগরিক সেবা পোর্টাল`, `${a.service} (আবেদন নম্বর: ${a.no}) ${LBL[status]}।${note ? `\nমন্তব্য: ${note}` : ''}\n\nবিস্তারিত: ${process.env.SITE_URL || 'http://localhost:3000'}/track?no=${a.no}`);
  } catch (e) { console.error('ইমেইল পাঠানো যায়নি:', e.message); }
  return true;
}

const EL = { approved: 'অনুমোদন করা হয়েছে', rejected: 'বাতিল করা হয়েছে', revoked: 'প্রত্যাহার করা হয়েছে' };
// উদ্যোক্তার অনুমতি দেওয়া, বাতিল করা বা প্রত্যাহার করা। নাগরিককে ইমেইলে জানায়।
export async function decideEnt(id, status, note) {
  const c = await getCitizen(id);
  if (!c) return false;
  await patchCitizen(id, { ent_status: status, ent_note: note || null, ent_at: new Date().toISOString() });
  try {
    if (c.email) await sendMail(c.email, `আপনার উদ্যোক্তা আবেদন ${EL[status]} – নাগরিক সেবা পোর্টাল`, `আপনার উদ্যোক্তা অ্যাকাউন্টের অনুরোধ ${EL[status]}।${note ? `\nমন্তব্য: ${note}` : ''}${status === 'approved' ? `\n\nএখন থেকে অন্যের জন্য আবেদন করতে যান: ${process.env.SITE_URL || 'http://localhost:3000'}/ent` : ''}`);
  } catch (e) { console.error('ইমেইল পাঠানো যায়নি:', e.message); }
  return true;
}
