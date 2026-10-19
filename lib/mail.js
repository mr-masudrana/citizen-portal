import nodemailer from 'nodemailer';
// SMTP সেট না থাকলে ইমেইল যায় না, টার্মিনালে লেখাটি (লিংকসহ) ছাপা হয়। এটি শুধু লোকাল টেস্টের জন্য।
export async function sendMail(to, subject, text) {
  if (!process.env.SMTP_HOST) { console.log('[ইমেইল — SMTP সেট নেই]', to, '\n' + subject + '\n' + text); return; }
  const port = Number(process.env.SMTP_PORT || 587);
  const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
}
