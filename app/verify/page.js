import { get } from '../../lib/db';
export const dynamic = 'force-dynamic';
export default async function Verify({ searchParams }) {
  const no = String(searchParams.no || '').trim();
  const r = no ? await get(no) : null;
  const ok = r && r.status === 'approved';
  return (
    <div className="page">
      <h1>সনদ যাচাই</h1>
      <p className="sub">সনদ নম্বর লিখুন অথবা সনদের QR কোড স্ক্যান করুন।</p>
      <form className="card" method="get">
        <label htmlFor="no">সনদ নম্বর</label><input id="no" name="no" defaultValue={no} required />
        <button className="btn">যাচাই করুন</button>
      </form>
      {no && ok && (
        <div className="card res ok">
          <h2 style={{ color: 'var(--g)' }}>সনদটি বৈধ</h2>
          <div className="kv"><span>সনদের ধরন</span><b>{r.service}</b></div>
          <div className="kv"><span>সনদ নম্বর</span><b>{r.no}</b></div>
          <div className="kv"><span>নাম</span><b>{r.name}</b></div>
          <div className="kv"><span>ইস্যুর তারিখ</span><b>{new Date(r.decidedAt).toLocaleDateString('bn-BD')}</b></div>
          <div className="kv"><span>ইস্যুকারী</span><b>{process.env.UNION_NAME || 'ইউনিয়ন পরিষদ'}</b></div>
        </div>
      )}
      {no && !ok && (
        <div className="card res bad">
          <h2 style={{ color: 'var(--red)' }}>সনদ পাওয়া যায়নি</h2>
          <p style={{ margin: 0 }}>নম্বরটি আবার মিলিয়ে দেখুন। সন্দেহ হলে ইস্যুকারী ইউনিয়ন পরিষদে যোগাযোগ করুন।</p>
        </div>
      )}
    </div>
  );
}
