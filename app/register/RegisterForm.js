'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';

export default function RegisterForm() {
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function sendOtp(e) {
    e.preventDefault(); setMessage('');
    if (!form.name.trim() || form.name.trim().length > 120 || !/^01\d{9}$/.test(form.mobile.trim()) || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || form.password.length < 10 || form.password.length > 128) {
      setMessage('নাম, সঠিক মোবাইল নম্বর, ইমেইল এবং ১০–১২৮ অক্ষরের পাসওয়ার্ড দিন।'); return;
    }
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signUp({ email: form.email.trim().toLowerCase(), password: form.password, options: { data: { name: form.name.trim(), mobile: form.mobile.trim() } } });
      if (error) throw error;
      setStep('otp'); setMessage('আপনার ইমেইলে যাচাইকরণ কোড পাঠানো হয়েছে। Inbox ও Spam ফোল্ডার দেখুন।');
    } catch (err) { setMessage(err.message || 'কোড পাঠানো যায়নি। Supabase Auth সেটিংস যাচাই করুন।'); }
    finally { setBusy(false); }
  }
  async function verify(e) {
    e.preventDefault(); setMessage('');
    if (!/^\d{6}$/.test(otp.trim())) { setMessage('ইমেইলে পাওয়া ৬ ডিজিটের কোড দিন।'); return; }
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb.auth.verifyOtp({ email: form.email.trim().toLowerCase(), token: otp.trim(), type: 'signup' });
      if (error) throw error;
      if (!data.session?.access_token) throw new Error('ইমেইল যাচাই হয়েছে, কিন্তু সেশন তৈরি হয়নি। আবার লগইন করুন।');
      const res = await fetch('/api/auth/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: data.session.access_token, name: form.name.trim(), mobile: form.mobile.trim() }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'অ্যাকাউন্ট তৈরি করা যায়নি।');
      window.location.assign('/profile');
    } catch (err) { setMessage(err.message || 'OTP যাচাই করা যায়নি।'); }
    finally { setBusy(false); }
  }
  async function resend() {
    setMessage(''); setBusy(true);
    try { const { error } = await supabaseBrowser().auth.resend({ type: 'signup', email: form.email.trim().toLowerCase() }); if (error) throw error; setMessage('নতুন কোড পাঠানো হয়েছে।'); }
    catch (err) { setMessage(err.message || 'আবার কোড পাঠানো যায়নি।'); }
    finally { setBusy(false); }
  }
  return <div className="card">
    {message && <p className="badge" role="status">{message}</p>}
    {step === 'details' ? <form onSubmit={sendOtp}>
      <label htmlFor="name">আপনার নাম</label><input id="name" name="name" value={form.name} onChange={change} maxLength={120} autoComplete="name" required />
      <label htmlFor="mobile">মোবাইল নম্বর</label><input id="mobile" name="mobile" value={form.mobile} onChange={change} inputMode="numeric" placeholder="01XXXXXXXXX" maxLength={11} required />
      <label htmlFor="email">ইমেইল</label><input id="email" name="email" type="email" value={form.email} onChange={change} autoComplete="email" required />
      <label htmlFor="password">পাসওয়ার্ড (১০–১২৮ অক্ষর)</label><input id="password" name="password" type="password" value={form.password} onChange={change} minLength={10} maxLength={128} autoComplete="new-password" required />
      <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'কোড পাঠানো হচ্ছে…' : 'ইমেইলে OTP পাঠান'}</button>
    </form> : <form onSubmit={verify}>
      <p className="sub">যাচাইকরণ কোড পাঠানো হয়েছে: <strong>{form.email}</strong></p>
      <label htmlFor="otp">৬ ডিজিটের OTP</label><input id="otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
      <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'যাচাই হচ্ছে…' : 'OTP যাচাই করে নিবন্ধন সম্পন্ন করুন'}</button>
      <button type="button" className="btn out" disabled={busy} onClick={resend} style={{ width: '100%', marginTop: 8 }}>আবার OTP পাঠান</button>
      <button type="button" className="btn out" disabled={busy} onClick={() => { setStep('details'); setMessage(''); }} style={{ width: '100%', marginTop: 8 }}>তথ্য পরিবর্তন</button>
    </form>}
  </div>;
}
