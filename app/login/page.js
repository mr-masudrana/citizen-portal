import { redirect } from 'next/navigation';
import { currentCitizen, verify, startSession } from '../../lib/auth';
import { getByMobile } from '../../lib/db';
import EmailLogin from './EmailLogin';
const safe = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') && !n.includes('\r') && !n.includes('\n') ? n : '/dashboard');
async function legacyLogin(fd) {
  'use server';
  const mobile = String(fd.get('mobile') || '').trim();
  const password = String(fd.get('password') || '');
  const next = safe(String(fd.get('next') || ''));
  if (!/^01\d{9}$/.test(mobile) || password.length > 128) redirect('/login?legacyError=1&next=' + encodeURIComponent(next));
  const u = await getByMobile(mobile);
  let valid = false;
  try { valid = !!u?.pass_hash && verify(password, u.pass_hash); } catch { valid = false; }
  if (!valid) redirect('/login?legacyError=1&next=' + encodeURIComponent(next));
  startSession(u.id);
  redirect(next);
}
export default async function Login({ searchParams }) {
  if (await currentCitizen()) redirect(safe(searchParams.next));
  return <div className="page" style={{ maxWidth: 520 }}>
    <h1>লগইন</h1>
    <p className="sub">নতুন অ্যাকাউন্টে ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।</p>
    {searchParams.passwordReset && <p className="badge" role="status">পাসওয়ার্ড পরিবর্তন হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>}
    <EmailLogin next={safe(searchParams.next)} />
    <details className="card" style={{ marginTop: 16 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>পুরোনো মোবাইল নম্বরের অ্যাকাউন্ট দিয়ে লগইন</summary>
      <p className="sub">আগে তৈরি করা মোবাইল/পাসওয়ার্ড অ্যাকাউন্টের জন্য।</p>
      {searchParams.legacyError && <p className="badge bad">মোবাইল নম্বর বা পাসওয়ার্ড ঠিক নেই।</p>}
      <form action={legacyLogin}>
        <input type="hidden" name="next" value={safe(searchParams.next)} />
        <label htmlFor="legacy-mobile">মোবাইল নম্বর</label><input id="legacy-mobile" name="mobile" inputMode="numeric" placeholder="01XXXXXXXXX" required />
        <label htmlFor="legacy-password">পাসওয়ার্ড</label><input id="legacy-password" name="password" type="password" autoComplete="current-password" required />
        <button className="btn out" style={{ width: '100%' }}>পুরোনো অ্যাকাউন্টে লগইন</button>
      </form>
    </details>
    <p className="sub" style={{ marginTop: 16 }}>নতুন? <a href="/register">ইমেইল OTP দিয়ে নিবন্ধন করুন</a></p>
  </div>;
}
