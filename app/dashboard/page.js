import { requireCitizen, percent } from '../../lib/auth';
import { byCitizen, byFiler, docUrls } from '../../lib/db';
import { Icon } from '../../lib/icons';
import { bn } from '../../lib/templates';
import { AccountBadge } from '../../lib/badge';
export const dynamic = 'force-dynamic';
const L = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Dashboard({ searchParams: sp }) {
  const u = await requireCitizen('/dashboard');
  const isEnt = u.ent_status === 'approved';
  const tab = isEnt && sp.tab === 'filed' ? 'filed' : 'own';
  const [own, filed] = await Promise.all([byCitizen(u.id), isEnt ? byFiler(u.id) : []]);
  const apps = tab === 'filed' ? filed : own;
  const pc = percent(u);
  const [ph] = u.photo ? await docUrls([u.photo]) : [];
  const ok = pc === 100 && u.email_verified;
  const n = (s) => apps.filter((a) => a.status === s).length;
  return (
    <div className="page">
      <h1>আমার অ্যাকাউন্ট</h1>
      {sp.ok && <p className="badge ok">আবেদন জমা হয়েছে। আবেদন নম্বর: {sp.no}</p>}
      <div className="card dash-pro">
        {ph?.url ? <img className="dp-av" src={ph.url} alt={`${u.name}-এর ছবি`} /> : <div className="pf-ini dp-av" aria-hidden="true">{[...(u.name_bn || u.name || '?')][0]}</div>}
        <div className="dp-info">
          <div className="dp-name">{u.name_bn || u.name}</div>
          <div style={{ margin: '0 0 6px', display: 'flex', flexWrap: 'wrap', gap: 6 }}><AccountBadge u={u} /></div>
          <div className="dp-line"><Icon n="phone" size={17} />{u.mobile || 'মোবাইল নম্বর যোগ করা হয়নি'}</div>
          <div className="dp-line"><Icon n="mail" size={17} />{u.email || 'ইমেইল যোগ করা হয়নি'}{u.email && <span className={`badge ${u.email_verified ? 'ok' : 'warn'}`}>{u.email_verified ? 'যাচাই হয়েছে' : 'যাচাই বাকি'}</span>}</div>
        </div>
        <div className="dp-act"><a className="btn" href="/profile" style={{ margin: 0 }}><Icon n="user" size={18} /> প্রোফাইল দেখুন</a></div>
      </div>
      <div className="card wallet-card" style={{ margin: '0 0 20px' }}>
        <div className="sec-h" style={{ marginBottom: 0 }}>
          <div><div className="sub" style={{ margin: 0 }}>ওয়ালেট ব্যালেন্স</div><div className="wal-amt">৳{bn(u.balance || 0)}</div></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><a className="btn sm" style={{ margin: 0 }} href="/wallet/topup"><Icon n="coins" size={16} /> ব্যালেন্স যোগ</a><a className="btn out sm" style={{ margin: 0 }} href="/wallet">লেনদেন</a></div>
        </div>
      </div>
      <div className="card" style={{ margin: '0 0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>প্রোফাইল সম্পূর্ণতা</span><span>{bn(pc)}%</span></div>
        <div className="bar" role="progressbar" aria-valuenow={pc} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pc}%` }} /></div>
        {ok
          ? <a className="btn" href="/#services">নিজের জন্য সেবার আবেদন করুন</a>
          : <><p className="sub" style={{ margin: '10px 0 0' }}>সেবার আবেদন করতে প্রোফাইল ১০০% সম্পূর্ণ করুন এবং ইমেইল যাচাই করুন।</p><a className="btn" href="/profile">প্রোফাইল সম্পূর্ণ করুন</a></>}
      </div>
      {!isEnt && (
        <div className="card" style={{ margin: '0 0 20px' }}>
          <div className="sec-h" style={{ marginBottom: 6 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, margin: 0 }}><span className="ic sm"><Icon n="briefcase" size={18} /></span>উদ্যোক্তা অ্যাকাউন্ট</h2>
            {u.ent_status === 'pending' ? <span className="badge warn">আবেদন বিবেচনাধীন</span> : u.ent_status === 'revoked' ? <span className="badge bad">অনুমতি প্রত্যাহার</span> : <a className="btn out sm" style={{ margin: 0 }} href="/entrepreneur">{u.ent_status === 'rejected' ? 'আবার আবেদন করুন' : 'উদ্যোক্তা হতে আবেদন'}</a>}
          </div>
          <p className="sub" style={{ margin: 0, fontSize: 15 }}>উদ্যোক্তা অন্যের নাম ঠিকানা দিয়ে তাঁদের হয়ে সনদের আবেদন করতে পারেন। অ্যাডমিনের অনুমতি লাগে।</p>
        </div>
      )}
      {isEnt && (
        <>
          <a className="btn" href="/apply/other" style={{ margin: '0 0 6px' }}><Icon n="file" size={18} /> অন্যের জন্য নতুন আবেদন</a>
          <div className="tabs" role="tablist">
            <a role="tab" aria-selected={tab === 'own'} className={tab === 'own' ? 'on' : ''} href="/dashboard">আমার নিজের আবেদন ({bn(own.length)})</a>
            <a role="tab" aria-selected={tab === 'filed'} className={tab === 'filed' ? 'on' : ''} href="/dashboard?tab=filed">অন্যের জন্য দাখিল ({bn(filed.length)})</a>
          </div>
        </>
      )}
      <div className="stats">
        {[['মোট আবেদন', apps.length, 'file'], ['অনুমোদিত', n('approved'), 'check'], ['অপেক্ষমাণ', n('pending'), 'clock'], ['বাতিল', n('rejected'), 'x']].map(([l, c, ic], i) => (
          <div key={l} className="stat" style={{ '--n': i }}><span className="ic"><Icon n={ic} /></span><div><b>{bn(c)}</b><span>{l}</span></div></div>
        ))}
      </div>
      <h2 style={{ fontSize: 22 }}>{tab === 'filed' ? 'অন্যের জন্য দাখিল করা আবেদন' : 'আমার আবেদনসমূহ'}</h2>
      {apps.length === 0 ? <p className="sub">{tab === 'filed' ? 'এখনো অন্যের জন্য কোনো আবেদন দাখিল করেননি।' : 'এখনো কোনো আবেদন করেননি।'}</p> : (
        <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th>{tab === 'filed' && <th>আবেদনকারী</th>}<th>অবস্থা</th><th>কাজ</th></tr></thead>
          <tbody>{apps.map((a) => (
            <tr key={a.no}><td>{a.no}</td><td>{a.service}</td>{tab === 'filed' && <td>{a.name_bn || a.name}</td>}
              <td><span className={`badge ${L[a.status][1]}`}>{L[a.status][0]}</span>{a.status === 'rejected' && a.admin_note && <><br /><small>কারণ: {a.admin_note}</small></>}</td>
              <td>{a.status === 'approved' ? <a href={`/certificate/${a.no}`}>সনদ দেখুন ও প্রিন্ট</a> : <span className="sub" style={{ margin: 0 }}>—</span>}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
