import { redirect } from 'next/navigation';
import { hash } from '../../lib/auth';
import { getByEmail, patchCitizen } from '../../lib/db';
import { sendOtp, checkOtp } from '../../lib/otp';
const to = (email, k, v) => `/reset?email=${encodeURIComponent(email)}&${k}=${v}`;
const em = (fd) => String(fd.get('email') || '').trim().toLowerCase();
async function doReset(fd) {
  'use server';
  const email = em(fd), pw = String(fd.get('password') || ''), c2 = String(fd.get('confirm') || '');
  if (pw.length < 8) redirect(to(email, 'e', 'short')); // পাসওয়ার্ড ঠিক না হলে কোড খরচ হয় না
  if (pw !== c2) redirect(to(email, 'e', 'match'));
  const res = await checkOtp('reset', email, fd.get('code'));
  if (res.error) redirect(to(email, 'e', res.error));
  await patchCitizen(res.payload.id, { pass_hash: hash(pw), email_verified: true }); // কোড ইমেইলে গিয়েছিল, তাই ইমেইল তাঁর নিজের
  redirect('/login?reset=1');
}
async function resend(fd) {
  'use server';
  const email = em(fd), u = email.includes('@') ? await getByEmail(email) : null;
  redirect(to(email, 'r', u ? await sendOtp('reset', email, { id: u.id }) : 'sent'));
}
const R = { sent: ['ok', 'ইমেইলটি নিবন্ধিত থাকলে একটি কোড পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।'], wait: ['warn', 'নতুন কোড পাঠাতে ১ মিনিট অপেক্ষা করুন। আগের কোডটিই চলবে।'], fail: ['bad', 'ইমেইল পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।'] };
const E = { short: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', match: 'পাসওয়ার্ড দুটি মেলেনি।', wrong: 'কোডটি ঠিক নেই। আবার দেখে লিখুন।', expired: 'কোডের মেয়াদ শেষ বা কোড নেই। নতুন কোড নিন।', locked: 'অনেকবার ভুল হয়েছে। ১ মিনিট পরে নতুন কোড নিন।' };
export default function Reset({ searchParams }) {
  const email = String(searchParams.email || ''), r = R[searchParams.r];
  if (!email) return <div className="page" style={{ maxWidth: 520 }}><h1>পাসওয়ার্ড রিসেট</h1><p className="sub">প্রথমে ইমেইলে কোড নিন।</p><a className="btn" href="/forgot">কোড নিন</a></div>;
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>নতুন পাসওয়ার্ড দিন</h1>
      {r && <p className={`badge ${r[0]}`}>{r[1]}</p>}
      {E[searchParams.e] && <p className="badge bad">{E[searchParams.e]}</p>}
      <p className="sub"><b>{email}</b> ঠিকানায় পাঠানো ৬ ডিজিটের কোড ও নতুন পাসওয়ার্ড দিন। কোড ১০ মিনিট বৈধ।</p>
      <form className="card" action={doReset}>
        <input type="hidden" name="email" value={email} />
        <label htmlFor="code" style={{ marginTop: 0 }}>৬ ডিজিটের কোড</label>
        <input id="code" name="code" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus />
        <label htmlFor="password">নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <label htmlFor="confirm">নতুন পাসওয়ার্ড আবার লিখুন</label><input id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required />
        <button className="btn" style={{ width: '100%' }}>পাসওয়ার্ড বদলান</button>
      </form>
      <form action={resend} style={{ marginTop: 14 }}><input type="hidden" name="email" value={email} /><button className="btn out" style={{ width: '100%', margin: 0 }}>কোড পাননি? আবার পাঠান</button></form>
    </div>
  );
}
