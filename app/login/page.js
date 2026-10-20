import { redirect } from 'next/navigation';
import { getByEmail } from '../../lib/db';
import { verify, startSession, currentCitizen } from '../../lib/auth';
const safe = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');
async function login(fd) {
  'use server';
  const next = String(fd.get('next') || ''), email = String(fd.get('email') || '').trim().toLowerCase();
  const u = email ? await getByEmail(email) : null;
  if (!u || !verify(String(fd.get('password') || ''), u.pass_hash)) redirect('/login?error=1&next=' + encodeURIComponent(next));
  if (u.blocked) redirect('/login?error=blocked');
  startSession(u);
  redirect(safe(next));
}
export default async function Login({ searchParams }) {
  if (await currentCitizen()) redirect(safe(searchParams.next));
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>লগইন</h1>
      <p className="sub">ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।</p>
      {searchParams.reset && <p className="badge ok">পাসওয়ার্ড বদলানো হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>}
      {searchParams.error === 'blocked' && <p className="badge bad">আপনার অ্যাকাউন্টটি বন্ধ আছে। বিস্তারিত জানতে ইউনিয়ন পরিষদের সঙ্গে যোগাযোগ করুন।</p>}
      {searchParams.error === '1' && <p className="badge bad">ইমেইল বা পাসওয়ার্ড ঠিক নেই। নিবন্ধনের কোড যাচাই না করে থাকলে নিচের লিংক থেকে নতুন কোড নিন।</p>}
      <form className="card" action={login}>
        <input type="hidden" name="next" value={searchParams.next || ''} />
        <label htmlFor="email">ইমেইল ঠিকানা</label><input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">পাসওয়ার্ড</label><input id="password" name="password" type="password" autoComplete="current-password" required />
        <button className="btn" style={{ width: '100%' }}>লগইন করুন</button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}><a href="/forgot">পাসওয়ার্ড ভুলে গেছেন?</a> · <a href="/register/verify">নিবন্ধনের কোড পাননি?</a> · নতুন? <a href="/register">নিবন্ধন করুন</a></p>
    </div>
  );
}
