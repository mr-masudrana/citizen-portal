import { headers } from 'next/headers';
import { getOtp, saveOtp, delOtp, cleanupOtps } from './db';
// সীমা গোনা হয় otps টেবিলে (key = ধরন:পরিচয়)। নির্ধারিত সময়ের জানালায় max-এর বেশি হলে true ফেরত দেয়।
export async function hit(key, max, windowMs) {
  if (Math.random() < 0.02) cleanupOtps();
  const r = await getOtp(key), live = !!r && new Date(r.expires_at) > new Date();
  const n = live ? r.attempts + 1 : 1;
  await saveOtp({ key, code_hash: '-', attempts: n, expires_at: live ? r.expires_at : new Date(Date.now() + windowMs).toISOString(), sent_at: new Date().toISOString(), payload: null });
  return n > max;
}
export const clear = (key) => delOtp(key);
// হোস্টিং প্ল্যাটফর্মের নিজের বসানো আইপি হেডার আগে। এটি হোস্টভেদে ভরসাযোগ্যতা ভিন্ন, তাই ইমেইলভিত্তিক ও সামগ্রিক সীমাও আছে।
export function clientIp() {
  const h = headers();
  return h.get('x-vercel-forwarded-for') || h.get('x-real-ip') || (h.get('x-forwarded-for') || 'local').split(',')[0].trim() || 'local';
}
