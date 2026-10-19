'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';
export default function EmailLogin({ next = '/dashboard' }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const { data, error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (!data.session?.access_token) throw new Error('লগইন সেশন পাওয়া যায়নি।');
      const res = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: data.session.access_token }) });
      const body = await res.json(); if (!res.ok) throw new Error(body.error || 'এই ইমেইলের সঙ্গে নাগরিক প্রোফাইল নেই।');
      window.location.assign(next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
    } catch (err) { setMessage(err.message || 'লগইন করা যায়নি।'); }
    finally { setBusy(false); }
  }
  return <form className="card" onSubmit={submit}>
    {message && <p className="badge bad" role="alert">{message}</p>}
    <label htmlFor="email">ইমেইল</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
    <label htmlFor="password">পাসওয়ার্ড</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
    <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'লগইন হচ্ছে…' : 'ইমেইল দিয়ে লগইন'}</button>
    <p className="sub" style={{ marginBottom: 0 }}><a href="/forgot-password">পাসওয়ার্ড ভুলে গেছেন?</a></p>
  </form>;
}
