import { redirect } from 'next/navigation';
import { getByEmail } from '../../lib/db';
import { sendResetMail } from '../../lib/mailers';
async function forgot(fd) {
  'use server';
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const u = email.includes('@') ? await getByEmail(email) : null;
  if (u) await sendResetMail(u);
  redirect('/forgot?done=1'); // ইমেইল আছে কি না, তা না জানিয়ে একই উত্তর দেওয়া হয়
}
export default function Forgot({ searchParams }) {
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>পাসওয়ার্ড রিসেট</h1>
      <p className="sub">নিবন্ধনের ইমেইল ঠিকানা দিন। আমরা একটি রিসেট লিংক পাঠাব।</p>
      {searchParams.error && <p className="badge bad">লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ। নতুন লিংকের জন্য আবার চেষ্টা করুন।</p>}
      {searchParams.done && <p className="badge ok">ইমেইলটি নিবন্ধিত থাকলে রিসেট লিংক পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।</p>}
      <form className="card" action={forgot}>
        <label htmlFor="email">ইমেইল ঠিকানা</label><input id="email" name="email" type="email" required />
        <button className="btn" style={{ width: '100%' }}>রিসেট লিংক পাঠান</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}><a href="/login">লগইনে ফিরে যান</a></p>
    </div>
  );
}
