import { redirect } from 'next/navigation';
import { getByEmail, addCitizen } from '../../../lib/db';
import { startSession } from '../../../lib/auth';
import { sendOtp, checkOtp } from '../../../lib/otp';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const to = (email, k, v) => `/register/verify?email=${encodeURIComponent(email)}&${k}=${v}`;
const em = (fd) => String(fd.get('email') || '').trim().toLowerCase();
async function confirmCode(fd) {
  'use server';
  const email = em(fd), res = await checkOtp('signup', email, fd.get('code'));
  if (res.error) redirect(to(email, 'e', res.error));
  if (await getByEmail(email)) redirect('/login');
  const u = await addCitizen({ name: res.payload.name, email, email_verified: true, pass_hash: res.payload.pass_hash });
  startSession(u);
  redirect('/profile?welcome=1');
}
async function resend(fd) {
  'use server';
  const email = em(fd);
  redirect(to(email, 'r', EMAIL.test(email) ? await sendOtp('signup', email) : 'none'));
}
const R = { sent: ['ok', 'নতুন কোড পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।'], wait: ['warn', 'নতুন কোড পাঠাতে ১ মিনিট অপেক্ষা করুন। আগের কোডটিই চলবে।'], fail: ['bad', 'ইমেইল পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।'], none: ['bad', 'এই ইমেইলে কোনো অপেক্ষমাণ নিবন্ধন নেই। আবার নিবন্ধন করুন।'] };
const E = { wrong: 'কোডটি ঠিক নেই। আবার দেখে লিখুন।', expired: 'কোডের মেয়াদ শেষ বা কোড নেই। নতুন কোড নিন।', locked: 'অনেকবার ভুল হয়েছে। ১ মিনিট পরে নতুন কোড নিন।' };
export default function Verify({ searchParams }) {
  const email = String(searchParams.email || ''), r = R[searchParams.r];
  if (!email) return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>নিবন্ধনের কোড</h1>
      <p className="sub">যে ইমেইলে নিবন্ধন করেছেন সেটি লিখুন।</p>
      <form className="card" method="get"><label htmlFor="email" style={{ marginTop: 0 }}>ইমেইল ঠিকানা</label><input id="email" name="email" type="email" required /><button className="btn" style={{ width: '100%' }}>চালিয়ে যান</button></form>
    </div>
  );
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>কোড লিখুন</h1>
      {r && <p className={`badge ${r[0]}`}>{r[1]}</p>}
      {E[searchParams.e] && <p className="badge bad">{E[searchParams.e]}</p>}
      <p className="sub"><b>{email}</b> ঠিকানায় একটি ৬ ডিজিটের কোড পাঠানো হয়েছে। কোডটি ১০ মিনিট বৈধ।</p>
      <form className="card" action={confirmCode}>
        <input type="hidden" name="email" value={email} />
        <label htmlFor="code" style={{ marginTop: 0 }}>৬ ডিজিটের কোড</label>
        <input id="code" name="code" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus />
        <button className="btn" style={{ width: '100%' }}>অ্যাকাউন্ট তৈরি করুন</button>
      </form>
      <form action={resend} style={{ marginTop: 14 }}>
        <input type="hidden" name="email" value={email} />
        <button className="btn out" style={{ width: '100%', margin: 0 }}>কোড পাননি? আবার পাঠান</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}>ভুল ইমেইল দিয়েছেন? <a href="/register">আবার নিবন্ধন করুন</a></p>
    </div>
  );
}
