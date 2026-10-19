'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';
export default function ForgotForm() {
 const [email,setEmail]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{const sb=supabaseBrowser();const {error}=await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error;setMessage('যদি এই ইমেইলে অ্যাকাউন্ট থাকে, তাহলে পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হয়েছে। Inbox ও Spam দেখুন।');}catch(err){setMessage(err.message||'অনুরোধ পাঠানো যায়নি।');}finally{setBusy(false)}}
 return <form className="card" onSubmit={submit}>{message&&<p className="badge" role="status">{message}</p>}<label htmlFor="email">অ্যাকাউন্টের ইমেইল</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/><button className="btn" disabled={busy} style={{width:'100%'}}>{busy?'পাঠানো হচ্ছে…':'রিসেট কোড/লিংক পাঠান'}</button></form>;
}
