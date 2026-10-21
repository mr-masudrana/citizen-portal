import { requireEnt } from '../../lib/ent';
import { byFiler } from '../../lib/db';
import { Icon } from '../../lib/icons';
import { bn } from '../../lib/templates';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Ent({ searchParams: sp }) {
  const u = await requireEnt('/ent');
  const apps = await byFiler(u.id);
  const n = (s) => apps.filter((a) => a.status === s).length;
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>উদ্যোক্তা প্যানেল</h1>
      <p className="sub">{u.ent_data?.center} — অন্যের জন্য সনদের আবেদন ও তার অবস্থা</p>
      {sp.ok && <p className="badge ok">আবেদন জমা হয়েছে। আবেদন নম্বর: {sp.no}</p>}
      <div className="stats">
        {[['মোট দাখিল', apps.length, 'file'], ['অপেক্ষমাণ', n('pending'), 'clock'], ['অনুমোদিত', n('approved'), 'check'], ['বাতিল', n('rejected'), 'x']].map(([l, c, ic], i) => (
          <div key={l} className="stat" style={{ '--n': i }}><span className="ic"><Icon n={ic} /></span><div><b>{bn(c)}</b><span>{l}</span></div></div>
        ))}
      </div>
      <a className="btn" href="/ent/apply" style={{ margin: '0 0 20px' }}><Icon n="file" size={18} /> অন্যের জন্য নতুন আবেদন</a>
      <h2 style={{ fontSize: 22 }}>আমার দাখিল করা আবেদন</h2>
      {apps.length === 0 ? <p className="sub">এখনো কোনো আবেদন দাখিল করেননি।</p> : (
        <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th><th>আবেদনকারী</th><th>অবস্থা</th><th>কাজ</th></tr></thead>
          <tbody>{apps.map((a) => (
            <tr key={a.no}><td>{a.no}</td><td>{a.service}</td><td>{a.name_bn || a.name}</td>
              <td><span className={`badge ${ST[a.status][1]}`}>{ST[a.status][0]}</span>{a.status === 'rejected' && a.admin_note && <><br /><small>কারণ: {a.admin_note}</small></>}</td>
              <td>{a.status === 'approved' ? <a href={`/certificate/${a.no}`}>সনদ দেখুন ও প্রিন্ট</a> : <a href={`/track?no=${a.no}`}>অবস্থা</a>}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
