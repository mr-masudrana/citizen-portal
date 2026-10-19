'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';
export default function LogoutButton(){const [busy,setBusy]=useState(false);async function logout(){setBusy(true);try{await supabaseBrowser().auth.signOut();}catch{}try{await fetch('/api/auth/logout',{method:'POST'});}finally{window.location.assign('/');}}return <button type="button" className="btn out sm" disabled={busy} onClick={logout}>{busy?'লগআউট হচ্ছে…':'লগআউট'}</button>}
