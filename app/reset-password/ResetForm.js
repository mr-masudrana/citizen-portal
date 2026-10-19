'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';
export default function ResetForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setVerified(true);
        setMessage('Recovery লিংক যাচাই হয়েছে। নতুন পাসওয়ার্ড দিন।');
      }
    });
    // Only the PASSWORD_RECOVERY event or a verified recovery OTP unlocks password changes.
    return () => data.subscription.unsubscribe();
  }, []);
  async function verify(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp.trim(), type: 'recovery' });
      if (error) throw error;
      setVerified(true); setMessage('কোড যাচাই হয়েছে। এখন নতুন পাসওয়ার্ড দিন।');
    } catch (err) { setMessage(err.message || 'কোড যাচাই করা যায়নি।'); }
    finally { setBusy(false); }
  }
  async function update(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    if (password.length < 10 || password.length > 128) { setBusy(false); setMessage('পাসওয়ার্ড ১০–১২৮ অক্ষরের হতে হবে।'); return; }
    try {
      const { error } = await supabaseBrowser().auth.updateUser({ password });
      if (error) throw error;
      await supabaseBrowser().auth.signOut();
      setMessage('পাসওয়ার্ড পরিবর্তন হয়েছে। নিরাপত্তার জন্য লগআউট করা হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
      window.location.assign('/login?passwordReset=1');
    } catch (err) { setMessage(err.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি।'); }
    finally { setBusy(false); }
  }
  return <div className="card">{message && <p className="badge" role="status">{message}</p>}{!verified ? <form onSubmit={verify}><p className="sub">Recovery ইমেইলে OTP কোড পেলে এখানে দিন। ইমেইলে রিসেট লিংক পাঠানো হলে সেটি খুলুন।</p><label htmlFor="email">ইমেইল</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required/><label htmlFor="otp">Recovery OTP (৬ ডিজিট)</label><input id="otp" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required/><button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'যাচাই হচ্ছে…' : 'কোড যাচাই করুন'}</button></form> : <form onSubmit={update}><label htmlFor="password">নতুন পাসওয়ার্ড (১০–১২৮ অক্ষর)</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={10} maxLength={128} autoComplete="new-password" required/><button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'সংরক্ষণ হচ্ছে…' : 'নতুন পাসওয়ার্ড সংরক্ষণ করুন'}</button></form>}</div>;
}
