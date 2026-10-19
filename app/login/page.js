import { redirect } from 'next/navigation';
import { getByMobile, getByEmail } from '../../lib/db';
import { verify, startSession, currentCitizen } from '../../lib/auth';
const safe = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');
async function login(fd) {
  'use server';
  const next = String(fd.get('next') || ''), id = String(fd.get('id') || '').trim().toLowerCase();
  const u = id.includes('@') ? await getByEmail(id) : await getByMobile(id);
  if (!u || !verify(String(fd.get('password') || ''), u.pass_hash)) redirect('/login?error=1&next=' + encodeURIComponent(next));
  startSession(u);
  redirect(safe(next));
}
export default async function Login({ searchParams }) {
  if (await currentCitizen()) redirect(safe(searchParams.next));
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>লগইন</h1>
      <p className="sub">ইমেইল (বা মোবাইল নম্বর) ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।</p>
      {searchParams.reset && <p className="badge ok">পাসওয়ার্ড বদলানো হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>}
      {searchParams.error && <p className="badge bad">ইমেইল/মোবাইল বা পাসওয়ার্ড ঠিক নেই।</p>}
      <form className="card" action={login}>
        <input type="hidden" name="next" value={searchParams.next || ''} />
        <label htmlFor="id">ইমেইল বা মোবাইল নম্বর</label><input id="id" name="id" autoComplete="username" required />
        <label htmlFor="password">পাসওয়ার্ড</label><input id="password" name="password" type="password" autoComplete="current-password" required />
        <button className="btn" style={{ width: '100%' }}>লগইন করুন</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}><a href="/forgot">পাসওয়ার্ড ভুলে গেছেন?</a> · নতুন? <a href="/register">নিবন্ধন করুন</a></p>
    </div>
  );
}
