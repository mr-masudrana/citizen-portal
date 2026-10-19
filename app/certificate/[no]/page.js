import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import { notFound } from 'next/navigation';
import { get, getSettings } from '../../../lib/db';
import { bn, bodyFor, familyIntro } from '../../../lib/templates';
import PrintButton from './PrintButton';
export const dynamic = 'force-dynamic';
const has = (f) => fs.existsSync(path.join(process.cwd(), 'public', f));
const dmy = (iso) => bn(new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replaceAll('/', '-'));
const Tbl = ({ rows }) => (
  <table style={{ width: '100%', minWidth: 0, fontSize: 16, background: 'transparent' }}>
    <thead><tr><th>ক্রম</th><th>নাম</th><th>সম্পর্ক</th><th>NID / জন্ম নিবন্ধন</th></tr></thead>
    <tbody>{rows.map((h, i) => <tr key={i}><td>{bn(i + 1)}</td><td>{h.name}</td><td>{h.rel}</td><td>{bn(h.nid) || '-'}</td></tr>)}</tbody>
  </table>
);
export default async function Certificate({ params, searchParams }) {
  const r = await get(params.no);
  if (!r || r.status !== 'approved' || r.mobile !== searchParams.mobile) notFound();
  const site = process.env.SITE_URL || 'http://localhost:3000', e = process.env, x = r.extra, st = await getSettings();
  const qr = await QRCode.toDataURL(`${site}/verify?no=${r.no}`, { margin: 1, width: 240 });
  const bc = 'data:image/png;base64,' + (await bwipjs.toBuffer({ bcid: 'code128', text: r.no, scale: 3, height: 9, includetext: false })).toString('base64');
  return (
    <>
      <div className="no-print" style={{ textAlign: 'center' }}><PrintButton /></div>
      <div className="cert">
        <div className="ct-ref">সনদ - {r.no}</div>
        <div className="cert-in">
          <img className="wm" src="/emblem.svg" alt="" aria-hidden="true" />
          <div className="ct-top">
            <div className="qrb"><div style={{ width: 92, textAlign: 'center' }}><img src={qr} alt="যাচাইয়ের QR কোড" width="92" height="92" /><div>যাচাই করুন</div></div></div>
            <div className="ct-head">
              <img src="/emblem.svg" alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের প্রতীক" width="88" height="88" />
              <div style={{ fontWeight: 600 }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
              <div className="un">{st.union_name || e.UNION_NAME || '[ইউনিয়ন পরিষদের নাম]'}</div>
              <div>উপজেলা: {st.upazila || e.UPAZILA || '[উপজেলা]'}, জেলা: {st.district || e.DISTRICT || '[জেলা]'}</div>
            </div>
            <div className="qrb" style={{ textAlign: 'right' }}><img src={bc} alt="সনদ নম্বরের বারকোড" width="130" height="46" /></div>
          </div>
          <div className="ct-line" />
          <div className="ct-no">
            <div>সনদ নং: {[...r.no].map((c, i) => <span key={i} className="bx">{bn(c)}</span>)}</div>
            <div>ইস্যুর তারিখ: {dmy(r.decidedAt)}</div>
          </div>
          <div className="ct-title"><span>{r.service}</span></div>
          <div className="ct-body">
            {x?.heirs ? (
              <>
                <p>এই মর্মে প্রত্যয়ন করা যাইতেছে যে, মৃত <b>{x.dname}</b> (পিতা: {x.dfather || '-'}, মৃত্যুর তারিখ: {x.ddeath ? dmy(x.ddeath) : '-'}, মৃত্যু সনদ নং: {bn(x.dcert) || '-'}, ঠিকানা: {x.daddr || '-'}) এর ওয়ারিশগণের তালিকা নিম্নরূপ:</p>
                <Tbl rows={x.heirs} />
              </>
            ) : x?.members ? (
              <><p>{familyIntro(r)}</p><Tbl rows={x.members} /></>
            ) : bodyFor(r)}
          </div>
          <div style={{ flex: 1 }} />
          <div className="ct-sign">
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <div style={{ height: 80 }}>{has('seal.png') && <img src="/seal.png" alt="ইউনিয়ন পরিষদের সীল" height="80" />}</div>
              <div style={{ borderTop: '1px solid #14231B', paddingTop: 4, fontSize: 14 }}>সীল</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 250 }}>
              <div style={{ height: 80 }}>{has('signature.png') && <img src="/signature.png" alt="স্বাক্ষর" height="70" />}</div>
              <div style={{ borderTop: '1px solid #14231B', paddingTop: 4, fontSize: 14 }}>অনুমোদনকারীর সীল ও স্বাক্ষর</div>
            </div>
          </div>
          <div className="ct-foot">সনদটি যাচাই করতে QR Code স্ক্যান করুন অথবা ওয়েবসাইট ভিজিট করুন: {site.replace(/^https?:\/\//, '')}/verify</div>
        </div>
      </div>
    </>
  );
}
