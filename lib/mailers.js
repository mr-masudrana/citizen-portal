import { makeToken } from './auth';
import { sendMail } from './mail';
import { patchCitizen } from './db';
const site = () => process.env.SITE_URL || 'http://localhost:3000';
// স্প্যাম ঠেকাতে একই ব্যবহারকারীকে ১ মিনিটে একটির বেশি ইমেইল পাঠানো হয় না।
async function gate(u) {
  if (u.mail_sent_at && Date.now() - new Date(u.mail_sent_at) < 60000) return false;
  await patchCitizen(u.id, { mail_sent_at: new Date().toISOString() });
  return true;
}
async function send(u, kind, hours, subject, line, path) {
  if (!(await gate(u))) return 'wait';
  const link = `${site()}/${path}?token=${makeToken(kind, u, hours)}`;
  try {
    await sendMail(u.email, subject, `${line} (লিংকটি ${hours} ঘণ্টা বৈধ):\n${link}\n\nআপনি এই অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।`);
    return 'sent';
  } catch (e) { console.error('ইমেইল পাঠানো যায়নি:', e.message); return 'fail'; }
}
export const sendVerifyMail = (u) => send(u, 'verify', 24, 'ইমেইল যাচাই করুন – নাগরিক সেবা পোর্টাল', 'আপনার ইমেইল যাচাই করতে নিচের লিংকে যান', 'verify-email');
export const sendResetMail = (u) => send(u, 'reset', 1, 'পাসওয়ার্ড রিসেট – নাগরিক সেবা পোর্টাল', 'নতুন পাসওয়ার্ড দিতে নিচের লিংকে যান', 'reset');
