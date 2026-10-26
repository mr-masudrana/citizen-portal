'use client';
import { usePathname } from 'next/navigation';
import { Icon } from '../lib/icons';
// items: [লিংক, আইকন, নাম, ছোট চিহ্ন (ঐচ্ছিক, যেমন ব্যালেন্স)]
export default function AccountNav({ items }) {
  const p = usePathname();
  return (
    <nav className="adm-nav" aria-label="অ্যাকাউন্ট মেনু">
      {items.map(([h, ic, t, chip]) => {
        const on = !h.includes('#') && p.startsWith(h);
        return <a key={h} href={h} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}><Icon n={ic} size={18} />{t}{chip && <em>{chip}</em>}</a>;
      })}
    </nav>
  );
}
