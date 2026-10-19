import QRCode from 'qrcode';
import { notFound } from 'next/navigation';
import { get } from '../../../lib/db';
import PrintButton from './PrintButton';
export const dynamic = 'force-dynamic';
const Row = ({ a, b }) => <div style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px dotted #9FB1A6' }}><span style={{ width: 200, color: '#51625A' }}>{a}</span><span>: {b || '—'}</span></div>;
export default async function Certificate({ params, searchParams }) {
  const r = await get(params.no);
  if (!r || r.status !== 'approved' || r.mobile !== searchParams.mobile) notFound();
  const qr = await QRCode.toDataURL(`${process.env.SITE_URL || 'http://localhost:3000'}/verify?no=${r.no}`, { margin: 1, width: 240 });
  const e = process.env, bn = (d) => new Date(d).toLocaleDateString('bn-BD'), x = r.extra;
  return (
    <>
      <div className="no-print" style={{ textAlign: 'center' }}><PrintButton /></div>
      <div className="cert"><div className="cert-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#51625A' }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#0B5D3B' }}>{e.UNION_NAME || '[ইউনিয়ন পরিষদের নাম]'}</div>
          <div>{e.UPAZILA || '[উপজেলা]'}, {e.DISTRICT || '[জেলা]'}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}><span>সনদ নম্বর: {r.no}</span><span>তারিখ: {bn(r.decidedAt)}</span></div>
        <div style={{ textAlign: 'center', margin: '24px 0' }}><span style={{ border: '2px solid #0B5D3B', padding: '8px 36px', borderRadius: 6, fontSize: 26, fontWeight: 700 }}>{r.service}</span></div>
        {x ? (
          <>
            <p style={{ lineHeight: 2, textAlign: 'justify', margin: 0 }}>এই মর্মে প্রত্যয়ন করা যাইতেছে যে, মৃত {x.dname} (পিতা: {x.dfather || '—'}, মৃত্যুর তারিখ: {x.ddeath ? bn(x.ddeath) : '—'}, মৃত্যু সনদ নম্বর: {x.dcert || '—'}, ঠিকানা: {x.daddr || '—'}) এর ওয়ারিশগণের তালিকা নিম্নরূপ:</p>
            <table style={{ width: '100%', minWidth: 0, marginTop: 14, fontSize: 15 }}>
              <thead><tr><th>ক্রম</th><th>নাম</th><th>সম্পর্ক</th><th>NID / জন্ম নিবন্ধন</th></tr></thead>
              <tbody>{x.heirs.map((h, i) => <tr key={i}><td>{i + 1}</td><td>{h.name}</td><td>{h.rel}</td><td>{h.nid || '—'}</td></tr>)}</tbody>
            </table>
          </>
        ) : (
          <>
            <p style={{ lineHeight: 2, textAlign: 'justify', margin: 0 }}>এই মর্মে প্রত্যয়ন করা যাইতেছে যে, নিম্নবর্ণিত ব্যক্তি এই ইউনিয়নের একজন বাসিন্দা। আবেদনের ভিত্তিতে তাঁহাকে এই সনদ প্রদান করা হইল।</p>
            <div style={{ marginTop: 20 }}>
              <Row a="নাম" b={r.name} /><Row a="পিতার নাম" b={r.father} /><Row a="মাতার নাম" b={r.mother} />
              <Row a="জন্ম তারিখ" b={r.dob && bn(r.dob)} /><Row a="NID / জন্ম নিবন্ধন নম্বর" b={r.nid} />
              <Row a="গ্রাম / ওয়ার্ড" b={`${r.village || '—'}, ওয়ার্ড ${r.ward || '—'}`} /><Row a="ডাকঘর" b={r.post} />
            </div>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}><img src={qr} alt="যাচাইয়ের QR কোড" width="110" height="110" /><div style={{ fontSize: 12, color: '#51625A' }}>স্ক্যান করে সনদ যাচাই করুন</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ width: 210, borderTop: '1px solid #14231B', paddingTop: 6 }}>{e.CHAIRMAN_NAME || '[চেয়ারম্যানের নাম]'}</div><b>চেয়ারম্যান</b><div>{e.UNION_NAME || '[ইউনিয়ন পরিষদের নাম]'}</div></div>
        </div>
      </div></div>
    </>
  );
}
