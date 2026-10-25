import './globals.css';
import { Suspense } from 'react';
import { Hind_Siliguri } from 'next/font/google';
import { redirect } from 'next/navigation';
import { currentCitizen, endSession } from '../lib/auth';
import { bn } from '../lib/templates';
import { Icon } from '../lib/icons';
import Toaster from './Toaster';
import MobileNav from './MobileNav';
import BottomNav from './BottomNav';
const font = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700'] });
export const metadata = { title: 'নাগরিক সেবা পোর্টাল', description: 'ইউনিয়ন পরিষদের অনলাইন সনদ সেবা' };
export const viewport = { themeColor: '#0B5D3B' };
async function logout() { 'use server'; endSession(); redirect('/'); }
const link = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[15px] font-medium text-ink no-underline transition hover:bg-brand-50 hover:text-brand-600';
const fl = 'text-white/70 no-underline transition hover:text-white';
export default async function RootLayout({ children }) {
  const u = await currentCitizen();
  const user = u ? { name: u.name_bn || u.name, wallet: bn(u.balance || 0) } : null;
  return (
    <html lang="bn">
      <body className={font.className}>
        <header className="site-hdr no-print sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
          <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <a href="/" className="flex items-center gap-3 no-underline">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30"><Icon n="shield" size={22} /></span>
              <span className="leading-tight"><b className="block text-[17px] text-brand-600 sm:text-lg">নাগরিক সেবা পোর্টাল</b><small className="hidden text-xs text-muted xs:block">অনলাইন সনদ সেবা</small></span>
            </a>
            <nav className="hidden items-center gap-1 md:flex" aria-label="প্রধান মেনু">
              <a href="/#services" className={link}><Icon n="file" size={17} />সেবাসমূহ</a>
              <a href="/verify" className={link}><Icon n="qr" size={17} />সনদ যাচাই</a>
              {user ? (
                <>
                  <a href="/wallet" className={`${link} bg-brand-50 text-brand-700`}><Icon n="coins" size={17} />ওয়ালেট ৳{user.wallet}</a>
                  <a href="/dashboard" className={link}><Icon n="grid" size={17} />আমার অ্যাকাউন্ট</a>
                  <form action={logout} className="m-0"><button className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[15px] font-medium text-ink transition hover:border-brand-500 hover:text-brand-600" style={{ font: 'inherit', fontWeight: 500 }}><Icon n="logout" size={16} />লগআউট</button></form>
                </>
              ) : (
                <>
                  <a href="/login" className={link}><Icon n="login" size={17} />লগইন</a>
                  <a href="/register" className="ml-1 inline-flex min-h-10 items-center rounded-lg bg-brand-600 px-4 text-[15px] font-semibold text-white no-underline shadow-sm transition hover:bg-brand-500">নিবন্ধন</a>
                </>
              )}
            </nav>
            <MobileNav user={user} logout={logout} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-ftr no-print mt-16 bg-brand-900 text-white/70">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div><div className="text-lg font-bold text-white">নাগরিক সেবা পোর্টাল</div><p className="m-0 mt-2 max-w-sm text-sm leading-relaxed">ইউনিয়ন পরিষদের সনদ ও প্রত্যয়ন সেবা এখন অনলাইনে। সনদ ইস্যু ইউনিয়ন পরিষদের অনুমোদনসাপেক্ষ।</p></div>
            <div><div className="mb-2 font-semibold text-white">দ্রুত লিংক</div><ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm"><li><a href="/#services" className={fl}>সেবাসমূহ</a></li><li><a href="/verify" className={fl}>সনদ যাচাই</a></li><li><a href="/entrepreneur" className={fl}>উদ্যোক্তা হতে চান?</a></li></ul></div>
            <div><div className="mb-2 font-semibold text-white">অ্যাকাউন্ট</div><ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">{u ? <><li><a href="/dashboard" className={fl}>আমার অ্যাকাউন্ট</a></li><li><a href="/wallet" className={fl}>ওয়ালেট</a></li></> : <><li><a href="/login" className={fl}>লগইন</a></li><li><a href="/register" className={fl}>নিবন্ধন</a></li></>}<li><a href="/forgot" className={fl}>পাসওয়ার্ড রিসেট</a></li></ul></div>
          </div>
        </footer>
        <div className="bnav-space h-16 md:hidden no-print" aria-hidden="true" />
        <BottomNav loggedIn={!!u} />
        <Suspense fallback={null}><Toaster /></Suspense>
      </body>
    </html>
  );
}
