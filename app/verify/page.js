import { getCertificateWithApplication, getSettings } from '../../lib/db';
export const dynamic = 'force-dynamic';
export default async function Verify({ searchParams }) {
  const no = String(searchParams.no || '').trim().toUpperCase().slice(0, 32);
  const cert = no ? await getCertificateWithApplication(no) : null;
  const st = cert ? await getSettings() : {};
  const valid = cert && cert.status === 'active' && cert.application?.status === 'approved';
  return <div className="page" style={{ maxWidth: 760 }}>
    <h1>সনদ যাচাই</h1><p className="sub">সনদের QR কোড স্ক্যান করুন অথবা সনদ নম্বর লিখুন।</p>
    <form className="card" method="get"><label htmlFor="no">সনদ নম্বর</label><input id="no" name="no" defaultValue={no} placeholder="CP-XXXXXXXXXX" maxLength={32} required/><button className="btn">যাচাই করুন</button></form>
    {no && valid && <div className="card res ok"><h2 style={{ color: 'var(--g)' }}>সনদটি বৈধ</h2><div className="kv"><span>সনদের ধরন</span><b>{cert.application.service}</b></div><div className="kv"><span>সনদ নম্বর</span><b>{cert.certificate_no}</b></div><div className="kv"><span>সনদধারীর নাম</span><b>{cert.application.name}</b></div><div className="kv"><span>ইস্যুর তারিখ</span><b>{new Date(cert.issued_at).toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka' })}</b></div><div className="kv"><span>ইস্যুকারী</span><b>{st.union_name || process.env.UNION_NAME || 'ইউনিয়ন পরিষদ'}</b></div></div>}
    {no && cert && !valid && <div className="card res bad"><h2 style={{ color: 'var(--red)' }}>{cert.status === 'revoked' ? 'সনদ বাতিল করা হয়েছে' : cert.status === 'reissued' ? 'এই সনদ পুনঃইস্যু হয়েছে' : 'সনদটি বৈধ নয়'}</h2><p>এই সনদটি বর্তমানে বৈধ নয়। সর্বশেষ সনদ নম্বর: {cert.replaced_by || 'প্রযোজ্য নয়'}।</p></div>}
    {no && !cert && <div className="card res bad"><h2 style={{ color: 'var(--red)' }}>সনদ পাওয়া যায়নি</h2><p>সনদ নম্বরটি যাচাই করুন অথবা ইস্যুকারী ইউনিয়ন পরিষদে যোগাযোগ করুন।</p></div>}
  </div>;
}
