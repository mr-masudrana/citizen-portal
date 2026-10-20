import { requireCitizen, percent } from '../../lib/auth';
import { byCitizen, docUrls } from '../../lib/db';
import { Icon } from '../../lib/icons';
import { bn } from '../../lib/templates';
const L = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Dashboard() {
  const u = await requireCitizen('/dashboard');
  const pc = percent(u), apps = await byCitizen(u.id);
  const [ph] = u.photo ? await docUrls([u.photo]) : [];
  const ok = pc === 100 && u.email_verified;
  return (
    <div className="page">
      <h1>আমার অ্যাকাউন্ট</h1>
      <div className="card dash-pro">
        {ph?.url ? <img className="dp-av" src={ph.url} alt={`${u.name}-এর ছবি`} /> : <div className="pf-ini dp-av" aria-hidden="true">{[...(u.name || '?')][0]}</div>}
        <div className="dp-info">
          <div className="dp-name">{u.name_bn || u.name}</div>
          <div className="dp-line"><Icon n="phone" size={17} />{u.mobile || 'মোবাইল নম্বর যোগ করা হয়নি'}</div>
          <div className="dp-line"><Icon n="mail" size={17} />{u.email || 'ইমেইল যোগ করা হয়নি'}{u.email && <span className={`badge ${u.email_verified ? 'ok' : 'warn'}`}>{u.email_verified ? 'যাচাই হয়েছে' : 'যাচাই বাকি'}</span>}</div>
        </div>
        <div className="dp-act"><a className="btn" href="/profile" style={{ margin: 0 }}><Icon n="user" size={18} /> প্রোফাইল দেখুন</a></div>
      </div>
      <div className="stats">
        {[['মোট আবেদন', apps.length, 'file'], ['অনুমোদিত', apps.filter((a) => a.status === 'approved').length, 'check'], ['অপেক্ষমাণ', apps.filter((a) => a.status === 'pending').length, 'clock']].map(([l, n, ic], i) => (
          <div key={l} className="stat" style={{ '--n': i }}><span className="ic"><Icon n={ic} /></span><div><b>{bn(n)}</b><span>{l}</span></div></div>
        ))}
      </div>
      <div className="card" style={{ margin: '0 0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>প্রোফাইল সম্পূর্ণতা</span><span>{bn(pc)}%</span></div>
        <div className="bar" role="progressbar" aria-valuenow={pc} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pc}%` }} /></div>
        {ok
          ? <a className="btn" href="/#services">সেবার আবেদন করুন</a>
          : <><p className="sub" style={{ margin: '10px 0 0' }}>সেবার আবেদন করতে প্রোফাইল ১০০% সম্পূর্ণ করুন এবং ইমেইল যাচাই করুন।</p><a className="btn" href="/profile">প্রোফাইল সম্পূর্ণ করুন</a></>}
      </div>
      <h2 style={{ fontSize: 22 }}>আমার আবেদনসমূহ</h2>
      {apps.length === 0 ? <p className="sub">এখনো কোনো আবেদন করেননি।</p> : (
        <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th><th>অবস্থা</th><th>কাজ</th></tr></thead>
          <tbody>{apps.map((a) => (
            <tr key={a.no}><td>{a.no}</td><td>{a.service}</td><td><span className={`badge ${L[a.status][1]}`}>{L[a.status][0]}</span></td>
              <td>{a.status === 'approved' ? <a href={`/certificate/${a.no}`}>সনদ দেখুন</a> : <a href={`/track?no=${a.no}`}>অবস্থা</a>}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
