import { redirect } from 'next/navigation';
import { getByEmail } from '../../lib/db';
import { sendOtp } from '../../lib/otp';
async function forgot(fd) {
  'use server';
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const u = email.includes('@') ? await getByEmail(email) : null;
  if (u) await sendOtp('reset', email, { id: u.id });
  redirect(`/reset?email=${encodeURIComponent(email)}&r=sent`); // ইমেইল নিবন্ধিত কি না তা না জানিয়ে একই পেজে নেওয়া হয়
}
export default function Forgot() {
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>পাসওয়ার্ড রিসেট</h1>
      <p className="sub">নিবন্ধনের ইমেইল ঠিকানা দিন। আমরা একটি ৬ ডিজিটের কোড পাঠাব।</p>
      <form className="card" action={forgot}>
        <label htmlFor="email" style={{ marginTop: 0 }}>ইমেইল ঠিকানা</label><input id="email" name="email" type="email" required />
        <button className="btn" style={{ width: '100%' }}>কোড পাঠান</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}><a href="/login">লগইনে ফিরে যান</a></p>
    </div>
  );
}
