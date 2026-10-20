import { get } from '../../lib/db';
import { currentCitizen } from '../../lib/auth';
import { Icon } from '../../lib/icons';
export const dynamic = 'force-dynamic';
const L = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Track({ searchParams }) {
  const no = String(searchParams.no || '').trim().toUpperCase();
  const r = no ? await get(no) : null;
  const me = r ? await currentCitizen() : null;
  const own = !!(me && r && me.id === r.citizen_id);
  return (
    <div className="page">
      <h1>আবেদনের অবস্থা</h1>
      <p className="sub">আবেদন নম্বর দিয়ে অবস্থা জানুন।</p>
      <form className="card" method="get">
        <label htmlFor="no" style={{ marginTop: 0 }}>আবেদন নম্বর</label>
        <input id="no" name="no" defaultValue={no} required />
        <button className="btn"><Icon n="search" size={18} /> খুঁজুন</button>
      </form>
      {no && !r && <div className="card res bad"><b>আবেদন পাওয়া যায়নি।</b> নম্বরটি আবার মিলিয়ে দেখুন।</div>}
      {r && (
        <div className="card res">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={{ margin: 0 }}>{r.service}</h2><span className={`badge ${L[r.status][1]}`}>{L[r.status][0]}</span>
          </div>
          <div className="kv"><span>আবেদন নম্বর</span><b>{r.no}</b></div>
          <div className="kv"><span>আবেদনের তারিখ</span><b>{new Date(r.createdAt).toLocaleDateString('bn-BD')}</b></div>
          {own && <div className="kv"><span>আবেদনকারী</span><b>{r.name}</b></div>}
          {own && r.status === 'approved' && <a className="btn" href={`/certificate/${r.no}`}>সনদ দেখুন ও প্রিন্ট করুন</a>}
          {!own && r.status === 'approved' && <p className="sub" style={{ margin: '14px 0 0' }}>সনদ দেখতে আবেদনকারীর অ্যাকাউন্টে <a href={`/login?next=${encodeURIComponent('/track?no=' + r.no)}`}>লগইন করুন</a>।</p>}
        </div>
      )}
    </div>
  );
}
