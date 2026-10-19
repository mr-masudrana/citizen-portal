import ResetForm from './ResetForm';
export default function ResetPassword(){return <div className="page" style={{maxWidth:520}}><h1>নতুন পাসওয়ার্ড</h1><p className="sub">ইমেইল থেকে পাওয়া OTP দিয়ে যাচাই করুন, তারপর নতুন পাসওয়ার্ড সেট করুন। Recovery email template-এ OTP সেট করা না থাকলে ইমেইলের লিংক খুলে আসুন।</p><ResetForm/></div>}
