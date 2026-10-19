import { requireCitizen, percent } from '../../lib/auth';
import { byCitizen } from '../../lib/db';
const L = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Dashboard() {
  const u = await requireCitizen('/dashboard');
  const pc = percent(u), apps = await byCitizen(u.id);
  return (
    <div className="page">
      <h1>স্বাগতম, {u.name}</h1>
      <div className="card" style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>প্রোফাইল সম্পূর্ণতা</span><span>{pc}%</span></div>
        <div className="bar" role="progressbar" aria-valuenow={pc} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pc}%` }} /></div>
        {pc < 100
          ? <><p className="sub" style={{ margin: '10px 0 0' }}>সেবার আবেদন করতে প্রোফাইল ১০০% সম্পূর্ণ করুন।</p><a className="btn" href="/profile">প্রোফাইল সম্পূর্ণ করুন</a></>
          : <a className="btn" href="/#services">সেবার আবেদন করুন</a>}
      </div>
      <h2 style={{ fontSize: 22 }}>আমার আবেদনসমূহ</h2>
      {apps.length === 0 ? <p className="sub">এখনো কোনো আবেদন করেননি।</p> : (
        <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th><th>অবস্থা</th><th>কাজ</th></tr></thead>
          <tbody>{apps.map((a) => (
            <tr key={a.no}><td>{a.no}</td><td>{a.service}</td><td><span className={`badge ${L[a.status][1]}`}>{L[a.status][0]}</span></td>
              <td>{a.status === 'approved' ? <a href={`/certificate/${a.no}?mobile=${a.mobile}`}>সনদ দেখুন</a> : <a href={`/track?no=${a.no}&mobile=${a.mobile}`}>অবস্থা</a>}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
