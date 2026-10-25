'use client';
import { usePathname } from 'next/navigation';
import { Icon } from '../lib/icons';
// ফোনে নিচের ট্যাব বার (অ্যাডমিন ও সনদ প্রিন্টের পেজে দেখায় না)
export default function BottomNav({ loggedIn }) {
  const p = usePathname();
  if (p.startsWith('/admin') || p.startsWith('/certificate')) return null;
  const items = loggedIn
    ? [['/', 'home', 'হোম'], ['/apply', 'file', 'সেবা'], ['/wallet', 'coins', 'ওয়ালেট'], ['/dashboard', 'user', 'অ্যাকাউন্ট']]
    : [['/', 'home', 'হোম'], ['/#services', 'file', 'সেবা'], ['/login', 'login', 'লগইন'], ['/register', 'user', 'নিবন্ধন']];
  const on = (h) => (h === '/' ? p === '/' : h.startsWith('/#') ? false : p.startsWith(h));
  return (
    <nav aria-label="নিচের মেনু" className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map(([h, ic, t]) => (
        <a key={h} href={h} aria-current={on(h) ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium no-underline transition ${on(h) ? 'text-brand-600' : 'text-muted'}`}>
          <Icon n={ic} size={22} />{t}
        </a>
      ))}
    </nav>
  );
}
