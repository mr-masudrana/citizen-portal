import './globals.css';
import { Suspense } from 'react';
import { Hind_Siliguri, Noto_Serif_Bengali } from 'next/font/google';
import { redirect } from 'next/navigation';
import { currentCitizen, endSession } from '../lib/auth';
import { bn } from '../lib/templates';
import { Icon } from '../lib/icons';
import Toaster from './Toaster';
import MenuButton from './MenuButton';
import TableLabels from './TableLabels';
// লেখা: Hind Siliguri। শিরোনাম: Noto Serif Bengali (সরকারি সনদের গাম্ভীর্য)।
const sans = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-sans' });
const serif = Noto_Serif_Bengali({ subsets: ['bengali', 'latin'], display: 'swap', variable: '--font-serif' });
export const metadata = { title: 'নাগরিক সেবা পোর্টাল', description: 'ইউনিয়ন পরিষদের অনলাইন সনদ সেবা' };
export const viewport = { themeColor: '#006A4E', width: 'device-width', initialScale: 1, viewportFit: 'cover' };
async function logout() { 'use server'; endSession(); redirect('/'); }
export default async function RootLayout({ children }) {
  const u = await currentCitizen();
  return (
    <html lang="bn" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} /></head>
      <body>
        <header className="hdr no-print">
          <a href="/" className="brand"><span className="logo"><Icon n="shield" size={22} /></span><span><b>নাগরিক সেবা পোর্টাল</b><small>ইউনিয়ন পরিষদের অনলাইন সনদ সেবা</small></span></a>
          <MenuButton />
          <nav id="main-nav" aria-label="প্রধান মেনু">
            <a href="/#services"><Icon n="file" size={17} />সেবাসমূহ</a>
            <a href="/verify"><Icon n="qr" size={17} />সনদ যাচাই</a>
            {u ? (
              <><a href="/dashboard"><Icon n="grid" size={17} />আমার অ্যাকাউন্ট</a><a href="/wallet"><Icon n="coins" size={17} />ওয়ালেট ৳{bn(u.balance || 0)}</a><form action={logout}><button className="btn out sm"><Icon n="logout" size={16} />লগআউট</button></form></>
            ) : (
              <><a href="/login"><Icon n="login" size={17} />লগইন</a><a className="navcta" href="/register">নিবন্ধন</a></>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="ftr no-print">
          <div className="ftr-in">
            <div><div className="ftr-b">নাগরিক সেবা পোর্টাল</div><p>ইউনিয়ন পরিষদের সনদ ও প্রত্যয়ন সেবা এখন অনলাইনে। সনদ ইস্যু ইউনিয়ন পরিষদের অনুমোদনসাপেক্ষ।</p></div>
            <div><div className="ftr-h">দ্রুত লিংক</div><a href="/#services">সেবাসমূহ</a><a href="/verify">সনদ যাচাই</a></div>
            <div><div className="ftr-h">অ্যাকাউন্ট</div>{u ? <a href="/dashboard">আমার অ্যাকাউন্ট</a> : <><a href="/login">লগইন</a><a href="/register">নিবন্ধন</a></>}<a href="/forgot">পাসওয়ার্ড রিসেট</a></div>
          </div>
        </footer>
        <Suspense fallback={null}><Toaster /></Suspense>
        <TableLabels />
      </body>
    </html>
  );
}
