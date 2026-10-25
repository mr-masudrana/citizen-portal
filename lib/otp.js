import { randomInt, createHash, timingSafeEqual } from 'crypto';
import { sendMail } from './mail';
import { getOtp, saveOtp, patchOtp, delOtp, cleanupOtps } from './db';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const MAX = 5, TTL = 10 * 60000, GAP = 60000; // ভুল চেষ্টা ৫, মেয়াদ ১০ মিনিট, নতুন কোড ১ মিনিট পর
const norm = (c) => String(c || '').replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/\D/g, '');
// purpose: 'signup' | 'reset' | 'email'। payload দিলে সেটি কোডের সঙ্গে রাখা হয় (যেমন নিবন্ধনের নাম ও পাসওয়ার্ড হ্যাশ)।
// ফেরত: 'sent' | 'wait' | 'fail' | 'none' (আবার পাঠানোর মতো কিছু নেই)
export async function sendOtp(purpose, email, payload) {
  const key = `${purpose}:${email}`;
  if (Math.random() < 0.02) cleanupOtps();
  const old = await getOtp(key);
  if (old && Date.now() - new Date(old.sent_at) < GAP) { if (payload) await patchOtp(key, { payload }); return 'wait'; }
  if (!old && !payload) return 'none';
  const code = String(randomInt(0, 1000000)).padStart(6, '0');
  await saveOtp({ key, code_hash: sha(`${key}:${code}`), expires_at: new Date(Date.now() + TTL).toISOString(), attempts: 0, sent_at: new Date().toISOString(), payload: payload ?? old.payload });
  try {
    await sendMail(email, 'আপনার নিশ্চিতকরণ কোড – নাগরিক সেবা পোর্টাল', `আপনার কোড: ${code}\n\nকোডটি ১০ মিনিট বৈধ। এই কোড কাউকে বলবেন না। আপনি এই অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।`);
    return 'sent';
  } catch (e) { console.error('ইমেইল পাঠানো যায়নি:', e.message); return 'fail'; }
}
// ফেরত: { payload } সফল হলে (কোড একবারই চলে), নইলে { error: 'wrong' | 'expired' | 'locked' }
export async function checkOtp(purpose, email, code) {
  const key = `${purpose}:${email}`, row = await getOtp(key);
  if (!row || new Date(row.expires_at) < new Date()) return { error: 'expired' };
  if (row.attempts >= MAX) return { error: 'locked' };
  const good = Buffer.from(row.code_hash), got = Buffer.from(sha(`${key}:${norm(code)}`));
  if (good.length !== got.length || !timingSafeEqual(good, got)) {
    await patchOtp(key, { attempts: row.attempts + 1 });
    return { error: row.attempts + 1 >= MAX ? 'locked' : 'wrong' };
  }
  await delOtp(key);
  return { payload: row.payload };
}
