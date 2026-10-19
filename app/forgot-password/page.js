import ForgotForm from './ForgotForm';
export default function ForgotPassword(){return <div className="page" style={{maxWidth:520}}><h1>পাসওয়ার্ড রিসেট</h1><p className="sub">আপনার নিবন্ধিত ইমেইল দিন। Supabase-এর Recovery email template-এ OTP চালু থাকলে কোড, অন্যথায় রিসেট লিংক পাবেন।</p><ForgotForm/><p className="sub" style={{marginTop:16}}><a href="/login">লগইনে ফিরে যান</a></p></div>}
