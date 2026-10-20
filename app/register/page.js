import { redirect } from 'next/navigation';
import { getByEmail } from '../../lib/db';
import { currentCitizen, hash } from '../../lib/auth';
import { sendOtp } from '../../lib/otp';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function reg(fd) {
  'use server';
  const name = String(fd.get('name') || '').trim().slice(0, 100), email = String(fd.get('email') || '').trim().toLowerCase();
  const pw = String(fd.get('password') || ''), c2 = String(fd.get('confirm') || '');
  if (!name || !EMAIL.test(email) || email.length > 120) redirect('/register?error=1');
  if (pw.length < 8) redirect('/register?error=short');
  if (pw !== c2) redirect('/register?error=match');
  if (await getByEmail(email)) redirect('/register?error=dup');
  redirect(`/register/verify?email=${encodeURIComponent(email)}&r=${await sendOtp('signup', email, { name, pass_hash: hash(pw) })}`);
}
export default async function Register({ searchParams }) {
  if (await currentCitizen()) redirect('/dashboard');
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>নাগরিক নিবন্ধন</h1>
      <p className="sub">নাম, ইমেইল ও পাসওয়ার্ড দিন। ইমেইলে একটি ৬ ডিজিটের কোড যাবে, কোডটি দিলেই অ্যাকাউন্ট তৈরি হবে।</p>
      {searchParams.error === '1' && <p className="badge bad">নাম ও সঠিক ইমেইল ঠিকানা দিন।</p>}
      {searchParams.error === 'short' && <p className="badge bad">পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।</p>}
      {searchParams.error === 'match' && <p className="badge bad">পাসওয়ার্ড দুটি মেলেনি।</p>}
      {searchParams.error === 'dup' && <p className="badge bad">এই ইমেইলে আগেই অ্যাকাউন্ট আছে। <a href="/login">লগইন করুন</a>।</p>}
      <form className="card" action={reg}>
        <label htmlFor="name">আপনার নাম</label><input id="name" name="name" autoComplete="name" required />
        <label htmlFor="email">ইমেইল ঠিকানা</label><input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <label htmlFor="confirm">পাসওয়ার্ড আবার লিখুন</label><input id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required />
        <button className="btn" style={{ width: '100%' }}>কোড পাঠান</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}>আগে নিবন্ধন করেছেন? <a href="/login">লগইন করুন</a></p>
    </div>
  );
}
