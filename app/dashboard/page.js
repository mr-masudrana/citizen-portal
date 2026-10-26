import { requireCitizen, percent } from '../../lib/auth';
import { byCitizen, byFiler, docUrls } from '../../lib/db';
import { Icon } from '../../lib/icons';
import { bn } from '../../lib/templates';
import { AccountBadge } from '../../lib/badge';
import AccountShell from '../AccountShell';
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
  const ready = pc === 100 && u.email_verified;
  const n = (s) => apps.filter((a) => a.status === s).length;
  const total = apps.length, share = (c) => (total ? (c / total) * 100 : 0);
  const stats = [
    ['coins', 'ওয়ালেট ব্যালেন্স', `৳${bn(u.balance || 0)}`, '', '/wallet'],
    ['file', 'মোট আবেদন', bn(total), ''],
    ['check', 'অনুমোদিত', bn(n('approved')), 'ok'],
    ['clock', 'অপেক্ষমাণ', bn(n('pending')), 'warn'],
    ['x', 'বাতিল', bn(n('rejected')), 'bad'],
  ];
  return (
    <AccountShell u={u}>
      <div className="acc-head">
        <div><h1>স্বাগতম, {u.name_bn || u.name}</h1><p className="sub" style={{ margin: 0 }}>আপনার আবেদন, ওয়ালেট ও প্রোফাইল এক জায়গায়।</p></div>
        <a className="btn" href="/#services"><Icon n="file" size={18} /> নতুন আবেদন</a>
      </div>
      {sp.ok && <p className="badge ok">আবেদন জমা হয়েছে। আবেদন নম্বর: {sp.no}</p>}
      <div className="adm-cards">
        {stats.map(([ic, l, v, cls, href], i) => {
          const body = <><span className="ic"><Icon n={ic} /></span><div><b>{v}</b><span>{l}</span></div></>;
          return href ? <a key={l} href={href} className={`adm-stat ${cls}`} style={{ '--n': i }}>{body}</a> : <div key={l} className={`adm-stat ${cls}`} style={{ '--n': i }}>{body}</div>;
        })}
      </div>
      {isEnt && (
        <div className="tabs" role="tablist">
          <a role="tab" aria-selected={tab === 'own'} className={tab === 'own' ? 'on' : ''} href="/dashboard">আমার নিজের আবেদন ({bn(own.length)})</a>
          <a role="tab" aria-selected={tab === 'filed'} className={tab === 'filed' ? 'on' : ''} href="/dashboard?tab=filed">অন্যের জন্য দাখিল ({bn(filed.length)})</a>
        </div>
      )}
      <div className="adm-grid">
        <section className="card adm-sec">
          <div className="sec-h"><h2><span className="ic sm"><Icon n="file" size={18} /></span>{tab === 'filed' ? 'অন্যের জন্য দাখিল করা আবেদন' : 'আমার আবেদনসমূহ'}</h2>{isEnt && <a className="btn out sm" href="/apply/other"><Icon n="users" size={16} /> অন্যের জন্য আবেদন</a>}</div>
          {apps.length === 0 ? (
            <div className="acc-empty"><span className="ic"><Icon n="file" size={24} /></span><p className="sub">{tab === 'filed' ? 'এখনো অন্যের জন্য কোনো আবেদন দাখিল করেননি।' : 'এখনো কোনো আবেদন করেননি। সেবা বেছে আবেদন শুরু করুন।'}</p><a className="btn sm" href={tab === 'filed' ? '/apply/other' : '/#services'}>{tab === 'filed' ? 'নতুন আবেদন দাখিল করুন' : 'সেবা বেছে নিন'}</a></div>
          ) : (
            <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th>{tab === 'filed' && <th>আবেদনকারী</th>}<th>অবস্থা</th><th>কাজ</th></tr></thead>
              <tbody>{apps.map((a) => (
                <tr key={a.no}><td>{a.no}</td><td>{a.service}</td>{tab === 'filed' && <td>{a.name_bn || a.name}</td>}
                  <td><span className={`badge ${L[a.status][1]}`}>{L[a.status][0]}</span>{a.status === 'rejected' && a.admin_note && <><br /><small>কারণ: {a.admin_note}</small></>}</td>
                  <td>{a.status === 'approved' ? <a href={`/certificate/${a.no}`} style={{ color: 'var(--g-d)', fontWeight: 600 }}>সনদ দেখুন ও প্রিন্ট</a> : <span className="sub" style={{ margin: 0 }}>—</span>}</td></tr>
              ))}</tbody></table></div>
          )}
        </section>
        <div>
          <section className="card adm-sec">
            <div className="mini-prof">
              {ph?.url ? <img className="dp-av" src={ph.url} alt={`${u.name}-এর ছবি`} /> : <div className="pf-ini dp-av" aria-hidden="true">{[...(u.name_bn || u.name || '?')][0]}</div>}
              <div style={{ minWidth: 0 }}><b>{u.name_bn || u.name}</b><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}><AccountBadge u={u} /></div></div>
            </div>
            <div className="dp-line" style={{ marginTop: 14 }}><Icon n="phone" size={17} />{u.mobile ? bn(u.mobile) : 'মোবাইল নম্বর যোগ করা হয়নি'}</div>
            <div className="dp-line"><Icon n="mail" size={17} />{u.email || 'ইমেইল যোগ করা হয়নি'}</div>
            {u.email && <div style={{ marginTop: 8 }}><span className={`badge ${u.email_verified ? 'ok' : 'warn'}`}>{u.email_verified ? 'ইমেইল যাচাই হয়েছে' : 'ইমেইল যাচাই বাকি'}</span></div>}
            <a className="btn out sm" href="/profile" style={{ marginTop: 14 }}><Icon n="user" size={16} /> প্রোফাইল দেখুন</a>
          </section>
          <section className="card adm-sec">
            <div className="sec-h" style={{ marginBottom: 4 }}><h2>প্রোফাইল সম্পূর্ণতা</h2><span className="pc-num">{bn(pc)}%</span></div>
            <div className="bar" role="progressbar" aria-valuenow={pc} aria-valuemin="0" aria-valuemax="100" aria-label="প্রোফাইল সম্পূর্ণতা"><i style={{ width: `${pc}%` }} /></div>
            {ready
              ? <p className="sub" style={{ margin: '12px 0 0', fontSize: 15 }}>প্রোফাইল সম্পূর্ণ। আপনি সেবার আবেদন করতে পারবেন।</p>
              : <><p className="sub" style={{ margin: '12px 0 0', fontSize: 15 }}>সেবার আবেদন করতে প্রোফাইল ১০০% সম্পূর্ণ করুন এবং ইমেইল যাচাই করুন।</p><a className="btn sm" href="/profile" style={{ marginTop: 12 }}>প্রোফাইল সম্পূর্ণ করুন</a></>}
          </section>
          {total > 0 && (
            <section className="card adm-sec">
              <h2>আবেদনের অবস্থা</h2>
              <div className="stack" role="img" aria-label={`অনুমোদিত ${bn(n('approved'))}, অপেক্ষমাণ ${bn(n('pending'))}, বাতিল ${bn(n('rejected'))}`}><i className="s-ok" style={{ width: `${share(n('approved'))}%` }} /><i className="s-warn" style={{ width: `${share(n('pending'))}%` }} /><i className="s-bad" style={{ width: `${share(n('rejected'))}%` }} /></div>
              <div className="legend"><span style={{ '--c': 'var(--g-l)' }}>অনুমোদিত {bn(n('approved'))}</span><span style={{ '--c': '#E0A93B' }}>অপেক্ষমাণ {bn(n('pending'))}</span><span style={{ '--c': 'var(--red)' }}>বাতিল {bn(n('rejected'))}</span></div>
            </section>
          )}
          <section className="card adm-sec wallet-card">
            <div className="sec-h" style={{ marginBottom: 4 }}><h2><span className="ic sm"><Icon n="coins" size={18} /></span>ওয়ালেট</h2></div>
            <div className="wal-amt">৳{bn(u.balance || 0)}</div>
            <div className="adm-acts" style={{ marginTop: 12 }}><a className="btn sm" href="/wallet/topup"><Icon n="coins" size={16} /> ব্যালেন্স যোগ</a><a className="btn out sm" href="/wallet">লেনদেন</a></div>
          </section>
          {!isEnt && (
            <section className="card adm-sec">
              <div className="sec-h" style={{ marginBottom: 6 }}><h2><span className="ic sm"><Icon n="briefcase" size={18} /></span>উদ্যোক্তা অ্যাকাউন্ট</h2></div>
              <p className="sub" style={{ margin: '0 0 12px', fontSize: 15 }}>উদ্যোক্তা অন্যের নাম ঠিকানা দিয়ে তাঁদের হয়ে সনদের আবেদন করতে পারেন। অ্যাডমিনের অনুমতি লাগে।</p>
              {u.ent_status === 'pending' ? <span className="badge warn">আবেদন বিবেচনাধীন</span> : u.ent_status === 'revoked' ? <span className="badge bad">অনুমতি প্রত্যাহার</span> : <a className="btn out sm" href="/entrepreneur">{u.ent_status === 'rejected' ? 'আবার আবেদন করুন' : 'উদ্যোক্তা হতে আবেদন'}</a>}
            </section>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
