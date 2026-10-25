import { redirect } from 'next/navigation';
import { getByEmail } from '../../lib/db';
import { verify, fakeVerify, startSession, currentCitizen } from '../../lib/auth';
import { hit, clear, clientIp } from '../../lib/limit';
const safe = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');
async function login(fd) {
  'use server';
  const next = String(fd.get('next') || ''), email = String(fd.get('email') || '').trim().toLowerCase();
  const pw = String(fd.get('password') || '').slice(0, 200), W = 15 * 60000;
  // ১৫ মিনিটে একই আইপি থেকে ৪০ বার বা একই ইমেইলে ৮ বার চেষ্টার পর বন্ধ
  if ((await hit(`login:ip:${clientIp()}`, 40, W)) || (email && (await hit(`login:${email}`, 8, W)))) redirect('/login?error=many');
  const u = email ? await getByEmail(email) : null;
  const ok = u ? verify(pw, u.pass_hash) : (fakeVerify(pw), false);
  if (!ok) redirect('/login?error=1&next=' + encodeURIComponent(next));
  if (u.blocked) redirect('/login?error=blocked');
  await clear(`login:${email}`);
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
      {searchParams.error === 'many' && <p className="badge bad">অনেকবার চেষ্টা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।</p>}
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
