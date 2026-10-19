import { redirect } from 'next/navigation';
import { getByMobile } from '../../lib/db';
import { verify, startSession, currentCitizen } from '../../lib/auth';
const safe = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');
async function login(fd) {
  'use server';
  const next = String(fd.get('next') || '');
  const u = await getByMobile(String(fd.get('mobile') || '').trim());
  if (!u || !verify(String(fd.get('password') || ''), u.pass_hash)) redirect('/login?error=1&next=' + encodeURIComponent(next));
  startSession(u.id);
  redirect(safe(next));
}
export default async function Login({ searchParams }) {
  if (await currentCitizen()) redirect(safe(searchParams.next));
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>লগইন</h1>
      <p className="sub">মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।</p>
      {searchParams.error && <p className="badge bad">মোবাইল নম্বর বা পাসওয়ার্ড ঠিক নেই।</p>}
      <form className="card" action={login}>
        <input type="hidden" name="next" value={searchParams.next || ''} />
        <label htmlFor="mobile">মোবাইল নম্বর</label><input id="mobile" name="mobile" inputMode="numeric" placeholder="01XXXXXXXXX" required />
        <label htmlFor="password">পাসওয়ার্ড</label><input id="password" name="password" type="password" autoComplete="current-password" required />
        <button className="btn" style={{ width: '100%' }}>লগইন করুন</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}>নতুন? <a href="/register">নিবন্ধন করুন</a></p>
    </div>
  );
}
