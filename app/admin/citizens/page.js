import { redirect } from 'next/navigation';
import { isAdmin, dt } from '../../../lib/admin';
import { listCitizens } from '../../../lib/db';
import { percent } from '../../../lib/auth';
import { Icon } from '../../../lib/icons';
import { bn } from '../../../lib/templates';
export const dynamic = 'force-dynamic';
export default async function Citizens({ searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const q = String(sp.q || '').slice(0, 60), page = Math.max(1, Number(sp.page) || 1), size = 20;
  const { rows, total } = await listCitizens({ q, page, size });
  const pages = Math.max(1, Math.ceil(total / size));
  const link = (p) => `/admin/citizens?${new URLSearchParams({ ...(q && { q }), ...(p > 1 && { page: p }) })}`;
  return (
    <>
      <h1>নাগরিক</h1><p className="sub">মোট {bn(total)} জন</p>
      <form className="card adm-filter" method="get"><div><label htmlFor="q">খুঁজুন</label><input id="q" name="q" defaultValue={q} placeholder="নাম, ইমেইল, NID বা মোবাইল" /></div><button className="btn" style={{ margin: 0 }}><Icon n="search" size={17} /> খুঁজুন</button></form>
      <section className="card adm-sec" style={{ padding: 0 }}>
        <div className="tbl"><table>
          <thead><tr><th>নাম</th><th>ইমেইল</th><th>মোবাইল</th><th>প্রোফাইল</th><th>নিবন্ধন</th><th>অবস্থা</th><th></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}>
              <td><b>{c.name_bn || c.name}</b></td>
              <td><small>{c.email}</small> <span className={`badge ${c.email_verified ? 'ok' : 'warn'}`}>{c.email_verified ? 'যাচাইকৃত' : 'যাচাই বাকি'}</span></td>
              <td>{c.mobile ? bn(c.mobile) : '—'}</td><td>{bn(percent(c))}%</td><td><small>{dt(c.created_at)}</small></td>
              <td>{c.blocked ? <span className="badge bad">ব্লকড</span> : <span className="badge ok">সক্রিয়</span>}</td>
              <td><a className="btn out sm" href={`/admin/citizens/${c.id}`}><Icon n="eye" size={15} /> দেখুন</a></td>
            </tr>
          ))}</tbody></table></div>
        {rows.length === 0 && <p className="sub" style={{ padding: '0 18px 18px' }}>কোনো নাগরিক পাওয়া যায়নি।</p>}
      </section>
      <div className="adm-pager"><a className={`btn out sm ${page <= 1 ? 'off' : ''}`} href={link(page - 1)}>← আগের</a><span>পৃষ্ঠা {bn(page)} / {bn(pages)}</span><a className={`btn out sm ${page >= pages ? 'off' : ''}`} href={link(page + 1)}>পরের →</a></div>
    </>
  );
}
