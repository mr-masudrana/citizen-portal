import { redirect } from 'next/navigation';
import { isAdmin, endAdmin } from '../../lib/admin';
import { Icon } from '../../lib/icons';
import AdminNav from './AdminNav';
export const metadata = { title: 'অ্যাডমিন – নাগরিক সেবা পোর্টাল', robots: { index: false, follow: false } };
async function logout() { 'use server'; endAdmin(); redirect('/admin'); }
export default function AdminLayout({ children }) {
  if (!isAdmin()) return <>{children}</>;
  return (
    <div className="adm-shell">
      <aside className="adm-side no-print">
        <a className="adm-brand" href="/admin"><span className="logo"><Icon n="shield" size={20} /></span><span><b>অ্যাডমিন প্যানেল</b><small>নাগরিক সেবা পোর্টাল</small></span></a>
        <AdminNav />
        <div className="adm-foot"><a href="/"><Icon n="home" size={17} /> সাইটে ফিরুন</a><form action={logout}><button><Icon n="logout" size={17} /> লগআউট</button></form></div>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
