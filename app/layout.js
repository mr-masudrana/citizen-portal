import './globals.css';
import { Hind_Siliguri } from 'next/font/google';
import { redirect } from 'next/navigation';
import { currentCitizen, endSession } from '../lib/auth';
const font = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '600', '700'] });
export const metadata = { title: 'নাগরিক সেবা পোর্টাল', description: 'ইউনিয়ন পরিষদের অনলাইন সনদ সেবা' };
async function logout() { 'use server'; endSession(); redirect('/'); }
export default async function RootLayout({ children }) {
  const u = await currentCitizen();
  return (
    <html lang="bn">
      <body className={font.className}>
        <header className="hdr no-print">
          <a href="/" className="brand">নাগরিক সেবা পোর্টাল</a>
          <nav>
            <a href="/#services">সেবাসমূহ</a><a href="/verify">সনদ যাচাই</a><a href="/track">আবেদনের অবস্থা</a>
            {u ? (<><a href="/dashboard">আমার অ্যাকাউন্ট</a><form action={logout}><button className="btn out sm">লগআউট</button></form></>)
              : (<><a href="/login">লগইন</a><a href="/register">নিবন্ধন</a></>)}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="ftr no-print">সনদ ইস্যু ইউনিয়ন পরিষদের অনুমোদনসাপেক্ষ।</footer>
      </body>
    </html>
  );
}
