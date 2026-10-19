import './globals.css';
import { Hind_Siliguri } from 'next/font/google';
const font = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '600', '700'] });
export const metadata = { title: 'নাগরিক সেবা পোর্টাল', description: 'ইউনিয়ন পরিষদের অনলাইন সনদ সেবা' };
export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className={font.className}>
        <header className="hdr no-print">
          <a href="/" className="brand">নাগরিক সেবা পোর্টাল</a>
          <nav><a href="/#services">সেবাসমূহ</a><a href="/verify">সনদ যাচাই</a><a href="/track">আবেদনের অবস্থা</a></nav>
        </header>
        <main>{children}</main>
        <footer className="ftr no-print">সনদ ইস্যু ইউনিয়ন পরিষদের অনুমোদনসাপেক্ষ।</footer>
      </body>
    </html>
  );
}
