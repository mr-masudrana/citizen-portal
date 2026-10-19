import { redirect } from 'next/navigation';
import { currentCitizen } from '../../lib/auth';
import RegisterForm from './RegisterForm';
export default async function Register() {
  if (await currentCitizen()) redirect('/dashboard');
  return <div className="page" style={{ maxWidth: 520 }}>
    <h1>নাগরিক নিবন্ধন</h1>
    <p className="sub">ইমেইলে OTP যাচাই করে অ্যাকাউন্ট খুলুন। যাচাই সম্পন্ন না হলে নাগরিক অ্যাকাউন্ট তৈরি হবে না।</p>
    <RegisterForm />
    <p className="sub" style={{ marginTop: 16 }}>আগে নিবন্ধন করেছেন? <a href="/login">লগইন করুন</a></p>
  </div>;
}
