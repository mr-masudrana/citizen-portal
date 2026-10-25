'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../lib/icons';
export default function MobileNav({ user, logout }) {
  const [open, setOpen] = useState(false);
  const p = usePathname();
  useEffect(() => setOpen(false), [p]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  const links = [['/#services', 'file', 'সেবাসমূহ'], ['/verify', 'qr', 'সনদ যাচাই'], ...(user ? [['/dashboard', 'grid', 'আমার অ্যাকাউন্ট'], ['/wallet', 'coins', `ওয়ালেট ৳${user.wallet}`]] : [['/login', 'login', 'লগইন'], ['/register', 'user', 'নিবন্ধন']])];
  const cls = 'flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium text-ink no-underline transition hover:bg-brand-50';
  return (
    <div className="md:hidden">
      <button type="button" aria-expanded={open} aria-controls="mnav" aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'} onClick={() => setOpen(!open)}
        className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white text-ink transition active:scale-95"><Icon n={open ? 'x' : 'menu'} size={22} /></button>
      {open && (
        <div id="mnav" className="absolute inset-x-0 top-full border-b border-line bg-white p-3 shadow-xl">
          {user && <div className="mb-1 truncate px-3 py-2 text-sm text-muted">{user.name}</div>}
          {links.map(([h, ic, t]) => <a key={h} href={h} className={cls}><Icon n={ic} size={20} className="text-brand-600" />{t}</a>)}
          {user && <form action={logout}><button className={`${cls} w-full cursor-pointer border-0 bg-transparent text-left font-[inherit]`}><Icon n="logout" size={20} className="text-brand-600" />লগআউট</button></form>}
        </div>
      )}
    </div>
  );
}
