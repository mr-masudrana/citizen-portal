import { redirect } from 'next/navigation';
import { isAdmin, dt } from '../../../lib/admin';
import { listEnt } from '../../../lib/db';
import { Icon } from '../../../lib/icons';
import { bn } from '../../../lib/templates';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'], revoked: ['প্রত্যাহার', 'bad'] };
export default async function Ents({ searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const status = sp.status === 'all' ? '' : ST[sp.status] ? sp.status : 'pending';
  const page = Math.max(1, Number(sp.page) || 1), size = 20;
  const { rows, total } = await listEnt({ status, page, size });
  const pages = Math.max(1, Math.ceil(total / size));
  const link = (p, s = status || 'all') => `/admin/entrepreneurs?status=${s}${p > 1 ? `&page=${p}` : ''}`;
  return (
    <>
      <h1>উদ্যোক্তা</h1><p className="sub">উদ্যোক্তা হওয়ার আবেদন ও অনুমোদিত উদ্যোক্তা</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {[...Object.entries(ST).map(([k, [l]]) => [k, l]), ['all', 'সব']].map(([k, l]) => <a key={k} className={`btn sm ${(status || 'all') === k ? '' : 'out'}`} style={{ margin: 0 }} href={link(1, k)}>{l}</a>)}
      </div>
      <section className="card adm-sec" style={{ padding: 0 }}>
        <div className="tbl"><table>
          <thead><tr><th>নাম</th><th>প্রতিষ্ঠান</th><th>ইমেইল</th><th>আবেদনের সময়</th><th>অবস্থা</th><th></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}><td><b>{c.name_bn || c.name}</b></td><td>{c.ent_data?.center || '—'}</td><td><small>{c.email}</small></td><td><small>{dt(c.ent_at)}</small></td>
              <td><span className={`badge ${ST[c.ent_status]?.[1]}`}>{ST[c.ent_status]?.[0]}</span></td>
              <td><a className="btn out sm" href={`/admin/entrepreneurs/${c.id}`}><Icon n="eye" size={15} /> দেখুন</a></td></tr>
          ))}</tbody></table></div>
        {rows.length === 0 && <p className="sub" style={{ padding: '0 18px 18px' }}>কোনো আবেদন নেই।</p>}
      </section>
      <div className="adm-pager"><a className={`btn out sm ${page <= 1 ? 'off' : ''}`} href={link(page - 1)}>← আগের</a><span>পৃষ্ঠা {bn(page)} / {bn(pages)}</span><a className={`btn out sm ${page >= pages ? 'off' : ''}`} href={link(page + 1)}>পরের →</a></div>
    </>
  );
}
