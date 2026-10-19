import { redirect } from 'next/navigation';
import { readToken } from '../../lib/auth';
import { patchCitizen } from '../../lib/db';
async function confirm(fd) {
  'use server';
  const u = await readToken('verify', String(fd.get('token') || ''));
  if (!u) redirect('/verify-email?error=1');
  await patchCitizen(u.id, { email_verified: true });
  redirect('/profile?verified=1');
}
export default async function VerifyEmail({ searchParams }) {
  const token = String(searchParams.token || '');
  const u = token ? await readToken('verify', token) : null;
  if (!u) return <div className="page" style={{ maxWidth: 520 }}><h1>লিংকটি কাজ করছে না</h1><p className="sub">লিংকটি অবৈধ, মেয়াদোত্তীর্ণ বা ইমেইল বদলে গেছে। প্রোফাইল থেকে নতুন যাচাইয়ের ইমেইল নিন।</p><a className="btn" href="/profile">প্রোফাইলে যান</a></div>;
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <h1>ইমেইল নিশ্চিত করুন</h1>
      <p className="sub">{u.email} ঠিকানাটি আপনার অ্যাকাউন্টের জন্য নিশ্চিত করতে নিচের বাটন চাপুন।</p>
      <form className="card" action={confirm}><input type="hidden" name="token" value={token} /><button className="btn" style={{ width: '100%', margin: 0 }}>ইমেইল নিশ্চিত করুন</button></form>
    </div>
  );
}
