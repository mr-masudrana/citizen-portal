import { redirect } from 'next/navigation';
import { addCitizen, getByMobile, getByEmail } from '../../lib/db';
import { hash, startSession, currentCitizen } from '../../lib/auth';
import { sendVerifyMail } from '../../lib/mailers';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function reg(fd) {
  'use server';
  const g = (k) => String(fd.get(k) || '').trim(), pw = String(fd.get('password') || ''), email = g('email').toLowerCase();
  if (!g('name') || !/^01\d{9}$/.test(g('mobile')) || !EMAIL.test(email) || email.length > 120 || pw.length < 8) redirect('/register?error=1');
  if (await getByMobile(g('mobile'))) redirect('/register?error=dup');
  if (await getByEmail(email)) redirect('/register?error=dupmail');
  const u = await addCitizen({ name: g('name'), mobile: g('mobile'), email, pass_hash: hash(pw) });
  startSession(u);
  redirect('/profile?mail=' + (await sendVerifyMail(u)));
}
export default async function Register({ searchParams }) {
  if (await currentCitizen()) redirect('/dashboard');
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>নাগরিক নিবন্ধন</h1>
      <p className="sub">নিবন্ধনের পর আপনার ইমেইলে একটি যাচাইয়ের লিংক যাবে।</p>
      {searchParams.error === '1' && <p className="badge bad">নাম, সঠিক ইমেইল, ১১ ডিজিটের মোবাইল নম্বর (01XXXXXXXXX) এবং কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।</p>}
      {searchParams.error === 'dup' && <p className="badge bad">এই মোবাইল নম্বরে আগেই নিবন্ধন করা আছে। <a href="/login">লগইন করুন</a>।</p>}
      {searchParams.error === 'dupmail' && <p className="badge bad">এই ইমেইলে আগেই নিবন্ধন করা আছে। <a href="/login">লগইন করুন</a>।</p>}
      <form className="card" action={reg}>
        <label htmlFor="name">আপনার নাম</label><input id="name" name="name" required />
        <label htmlFor="email">ইমেইল ঠিকানা</label><input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="mobile">মোবাইল নম্বর</label><input id="mobile" name="mobile" inputMode="numeric" placeholder="01XXXXXXXXX" required />
        <label htmlFor="password">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <button className="btn" style={{ width: '100%' }}>নিবন্ধন করুন</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}>আগে নিবন্ধন করেছেন? <a href="/login">লগইন করুন</a></p>
    </div>
  );
}
