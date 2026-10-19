import { redirect } from 'next/navigation';
import { addCitizen, getByMobile } from '../../lib/db';
import { hash, startSession, currentCitizen } from '../../lib/auth';
async function reg(fd) {
  'use server';
  const g = (k) => String(fd.get(k) || '').trim(), pw = String(fd.get('password') || '');
  if (!g('name') || !/^01\d{9}$/.test(g('mobile')) || pw.length < 8) redirect('/register?error=1');
  if (await getByMobile(g('mobile'))) redirect('/register?error=dup');
  const u = await addCitizen({ name: g('name'), mobile: g('mobile'), pass_hash: hash(pw) });
  startSession(u.id);
  redirect('/profile');
}
export default async function Register({ searchParams }) {
  if (await currentCitizen()) redirect('/dashboard');
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>নাগরিক নিবন্ধন</h1>
      <p className="sub">নিবন্ধনের পর প্রোফাইল ১০০% সম্পূর্ণ করলে সেবার আবেদন করা যাবে।</p>
      {searchParams.error === '1' && <p className="badge bad">নাম, ১১ ডিজিটের মোবাইল নম্বর (01XXXXXXXXX) এবং কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।</p>}
      {searchParams.error === 'dup' && <p className="badge bad">এই মোবাইল নম্বরে আগেই নিবন্ধন করা আছে। <a href="/login">লগইন করুন</a>।</p>}
      <form className="card" action={reg}>
        <label htmlFor="name">আপনার নাম</label><input id="name" name="name" required />
        <label htmlFor="mobile">মোবাইল নম্বর</label><input id="mobile" name="mobile" inputMode="numeric" placeholder="01XXXXXXXXX" required />
        <label htmlFor="password">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <button className="btn" style={{ width: '100%' }}>নিবন্ধন করুন</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}>আগে নিবন্ধন করেছেন? <a href="/login">লগইন করুন</a></p>
    </div>
  );
}
