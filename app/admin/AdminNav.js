'use client';
import { usePathname } from 'next/navigation';
import { Icon } from '../../lib/icons';
const L = [['/admin', 'grid', 'ড্যাশবোর্ড'], ['/admin/applications', 'file', 'আবেদনসমূহ'], ['/admin/citizens', 'users', 'নাগরিক'], ['/admin/entrepreneurs', 'briefcase', 'উদ্যোক্তা'], ['/admin/settings', 'settings', 'সেটিংস']];
export default function AdminNav() {
  const p = usePathname();
  return (
    <nav className="adm-nav" aria-label="অ্যাডমিন মেনু">
      {L.map(([h, ic, t]) => <a key={h} href={h} className={(h === '/admin' ? p === h : p.startsWith(h)) ? 'on' : ''}><Icon n={ic} size={18} />{t}</a>)}
    </nav>
  );
}
