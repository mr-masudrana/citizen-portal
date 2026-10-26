import { redirect } from 'next/navigation';
import { endSession } from '../lib/auth';
import { Icon } from '../lib/icons';
import { bn } from '../lib/templates';
import { AccountBadge } from '../lib/badge';
import AccountNav from './AccountNav';
async function logout() { 'use server'; endSession(); redirect('/'); }
// নাগরিক ও উদ্যোক্তার পেজের কাঠামো: অ্যাডমিন প্যানেলের মতো পাশের মেনু ও প্রধান অংশ।
// width: প্রধান অংশের সর্বোচ্চ প্রস্থ (ফর্মের পেজে ছোট রাখা হয়)।
export default function AccountShell({ u, width = 1120, children }) {
  const isEnt = u.ent_status === 'approved';
  const items = [
    ['/dashboard', 'grid', 'ড্যাশবোর্ড'],
    ['/#services', 'file', 'নতুন আবেদন'],
    ...(isEnt ? [['/apply/other', 'users', 'অন্যের জন্য আবেদন']] : []),
    ['/wallet', 'coins', 'ওয়ালেট', `৳${bn(u.balance || 0)}`],
    ['/profile', 'user', 'প্রোফাইল'],
    ...(!isEnt ? [['/entrepreneur', 'briefcase', 'উদ্যোক্তা হোন']] : []),
  ];
  return (
    <div className="adm-shell acc-shell">
      <aside className="adm-side no-print">
        <a className="adm-brand" href="/dashboard"><span className="logo"><Icon n="shield" size={20} /></span><span><b>নাগরিক সেবা পোর্টাল</b><small>{isEnt ? 'উদ্যোক্তা অ্যাকাউন্ট' : 'নাগরিক অ্যাকাউন্ট'}</small></span></a>
        <div className="acc-user"><span className="acc-av" aria-hidden="true">{[...(u.name_bn || u.name || '?')][0]}</span><div><b>{u.name_bn || u.name}</b><div className="acc-badges"><AccountBadge u={u} center={false} /></div></div></div>
        <AccountNav items={items} />
        <div className="adm-foot"><a href="/"><Icon n="home" size={17} /> হোম পেজ</a><a href="/verify"><Icon n="qr" size={17} /> সনদ যাচাই</a><form action={logout}><button><Icon n="logout" size={17} /> লগআউট</button></form></div>
      </aside>
      <div className="adm-main"><div className="acc-body" style={{ maxWidth: width }}>{children}</div></div>
    </div>
  );
}
