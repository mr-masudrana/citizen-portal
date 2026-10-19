import { get } from '../../lib/db';
export const dynamic = 'force-dynamic';
const L = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Track({ searchParams }) {
  const no = String(searchParams.no || '').trim(), mobile = String(searchParams.mobile || '').trim();
  const r = no && mobile ? await get(no) : null;
  const hit = r && r.mobile === mobile ? r : null;
  return (
    <div className="page">
      <h1>আবেদনের অবস্থা</h1>
      <p className="sub">আবেদন নম্বর ও মোবাইল নম্বর দিয়ে অবস্থা জানুন।</p>
      <form className="card" method="get">
        <div className="row">
          <div><label htmlFor="no">আবেদন নম্বর</label><input id="no" name="no" defaultValue={no} required /></div>
          <div><label htmlFor="mobile">মোবাইল নম্বর</label><input id="mobile" name="mobile" defaultValue={mobile} required /></div>
        </div>
        <button className="btn">খুঁজুন</button>
      </form>
      {no && mobile && !hit && <div className="card res bad"><b>আবেদন পাওয়া যায়নি।</b> নম্বর দুটি আবার মিলিয়ে দেখুন।</div>}
      {hit && (
        <div className="card res">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={{ margin: 0 }}>{hit.service}</h2><span className={`badge ${L[hit.status][1]}`}>{L[hit.status][0]}</span>
          </div>
          <div className="kv"><span>আবেদন নম্বর</span><b>{hit.no}</b></div>
          <div className="kv"><span>আবেদনকারী</span><b>{hit.name}</b></div>
          <div className="kv"><span>আবেদনের তারিখ</span><b>{new Date(hit.createdAt).toLocaleDateString('bn-BD')}</b></div>
          {hit.status === 'approved' && <a className="btn" href={`/certificate/${hit.no}?mobile=${hit.mobile}`}>সনদ দেখুন ও প্রিন্ট করুন</a>}
        </div>
      )}
    </div>
  );
}
