import { redirect } from 'next/navigation';
import { readToken, hash } from '../../lib/auth';
import { patchCitizen } from '../../lib/db';
async function doReset(fd) {
  'use server';
  const token = String(fd.get('token') || ''), pw = String(fd.get('password') || '');
  const u = await readToken('reset', token);
  if (!u) redirect('/forgot?error=1');
  if (pw.length < 8) redirect('/reset?error=pw&token=' + encodeURIComponent(token));
  await patchCitizen(u.id, { pass_hash: hash(pw), email_verified: true }); // রিসেট লিংকে ঢোকা মানে ইমেইল তাঁর নিজের
  redirect('/login?reset=1');
}
export default async function Reset({ searchParams }) {
  const token = String(searchParams.token || '');
  const u = token ? await readToken('reset', token) : null;
  if (!u) return <div className="page" style={{ maxWidth: 520 }}><h1>লিংকটি কাজ করছে না</h1><p className="sub">লিংকটি অবৈধ, মেয়াদোত্তীর্ণ বা আগেই ব্যবহার করা হয়েছে।</p><a className="btn" href="/forgot">নতুন লিংক নিন</a></div>;
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>নতুন পাসওয়ার্ড দিন</h1>
      {searchParams.error && <p className="badge bad">পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।</p>}
      <form className="card" action={doReset}>
        <input type="hidden" name="token" value={token} />
        <label htmlFor="password">নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <button className="btn" style={{ width: '100%' }}>পাসওয়ার্ড বদলান</button>
      </form>
    </div>
  );
}
