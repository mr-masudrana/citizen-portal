import { redirect } from 'next/navigation';
import AccountShell from '../../AccountShell';
import QRCode from 'qrcode';
import { requireCitizen } from '../../../lib/auth';
import { getSettings, addTopup, listTopups, docUrls } from '../../../lib/db';
import { dynamicQR, validPayload } from '../../../lib/banglaqr';
import { Icon } from '../../../lib/icons';
import { bn } from '../../../lib/templates';
export const dynamic = 'force-dynamic';
async function submit(fd) {
  'use server';
  const u = await requireCitizen('/wallet/topup');
  const amount = Number(fd.get('amount')), trx = String(fd.get('trx') || '').trim().toUpperCase().replace(/\s/g, ''), sender = String(fd.get('sender') || '').trim().slice(0, 40);
  if (!Number.isInteger(amount) || amount < 10 || amount > 50000) redirect('/wallet/topup?error=amount');
  const back = (e) => redirect(`/wallet/topup?amount=${amount}&error=${e}`);
  if (!/^[A-Z0-9]{6,30}$/.test(trx)) back('trx');
  if (sender.length < 4) back('sender');
  if ((await listTopups({ citizen: u.id, status: 'pending', size: 1 })).total >= 5) back('many');
  if ((await addTopup({ citizen_id: u.id, amount, trx_id: trx, sender, method: 'bangla_qr', status: 'pending' })) === 'dup') back('dup');
  redirect('/wallet?ok=topup');
}
const ERR = { amount: 'পরিমাণ ১০ থেকে ৫০,০০০ টাকার মধ্যে হতে হবে।', trx: 'TrxID শুধু ইংরেজি অক্ষর ও সংখ্যা (৬–৩০টি) হতে হবে।', sender: 'যে নম্বর বা অ্যাকাউন্ট থেকে পাঠিয়েছেন সেটি লিখুন।', many: 'আগের পাঁচটি অনুরোধ যাচাই না হওয়া পর্যন্ত নতুন অনুরোধ দেওয়া যাবে না।', dup: 'এই TrxID আগেই ব্যবহার হয়েছে।' };
export default async function Topup({ searchParams: sp }) {
  const u = await requireCitizen('/wallet/topup');
  const st = await getSettings();
  const amount = /^\d{1,5}$/.test(sp.amount || '') ? Number(sp.amount) : 0;
  const ok = amount >= 10 && amount <= 50000;
  const configured = !!(st.qr_payload || st.qr_image);
  let qr = '';
  if (configured && ok) {
    if (st.qr_payload) {
      let p = st.qr_payload;
      if (st.qr_dynamic && validPayload(p)) { try { p = dynamicQR(p, amount); } catch {} }
      qr = await QRCode.toDataURL(p, { margin: 1, width: 360 });
    } else { const [f] = await docUrls([st.qr_image]); qr = f?.url || ''; }
  }
  return (
    <AccountShell u={u} width={760}>
      <h1>ব্যালেন্স যোগ করুন</h1>
      <p className="sub">বাংলা QR দিয়ে পেমেন্ট করে TrxID জমা দিন। অ্যাডমিন যাচাই করলে ওয়ালেটে টাকা যোগ হবে।</p>
      {ERR[sp.error] && <p className="badge bad">{ERR[sp.error]}</p>}
      {!configured && <div className="card"><span className="badge warn">পেমেন্ট এখনো চালু হয়নি</span><p className="sub" style={{ margin: '10px 0 0' }}>অ্যাডমিন বাংলা QR যোগ করলে এখানে টাকা যোগ করা যাবে।</p></div>}
      {configured && !ok && (
        <form className="card" method="get">
          <label htmlFor="amount" style={{ marginTop: 0 }}>কত টাকা যোগ করবেন? (পূর্ণ টাকা)</label>
          <input id="amount" name="amount" type="number" min="10" max="50000" step="1" required inputMode="numeric" />
          <div className="amt-q">{[100, 200, 500, 1000].map((a) => <a key={a} className="btn out sm" href={`/wallet/topup?amount=${a}`}>৳{bn(a)}</a>)}</div>
          <button className="btn">চালিয়ে যান</button>
        </form>
      )}
      {configured && ok && (
        <>
          <div className="card qrbox">
            <div className="sub" style={{ margin: 0 }}>পরিশোধ করুন</div><div className="wal-amt">৳{bn(amount)}</div>
            {st.pay_name && <div style={{ fontWeight: 600 }}>{st.pay_name}</div>}
            {qr && <img src={qr} alt="বাংলা QR কোড" />}
            <ol className="steps-l"><li>bKash, Nagad, Rocket বা ব্যাংকের অ্যাপে "QR স্ক্যান" বেছে নিন।</li><li>এই QR স্ক্যান করে ঠিক <b>৳{bn(amount)}</b> পাঠান।</li><li>পেমেন্টের পর অ্যাপের মেসেজ বা রসিদের <b>TrxID</b> নিচে লিখুন।</li></ol>
            {st.pay_note && <p className="sub" style={{ margin: '8px 0 0', fontSize: 14 }}>{st.pay_note}</p>}
            <a className="btn out sm" href="/wallet/topup">পরিমাণ বদলান</a>
          </div>
          <form className="card" action={submit} style={{ marginTop: 16 }}>
            <input type="hidden" name="amount" value={amount} />
            <label htmlFor="trx" style={{ marginTop: 0 }}>TrxID (ট্রানজেকশন আইডি) <span className="req">*</span></label>
            <input id="trx" name="trx" required minLength={6} maxLength={30} autoComplete="off" placeholder="যেমন: 9K4L2M8XYZ" />
            <label htmlFor="sender">যে নম্বর বা অ্যাকাউন্ট থেকে পাঠিয়েছেন <span className="req">*</span></label>
            <input id="sender" name="sender" required minLength={4} maxLength={40} placeholder="যেমন: 01XXXXXXXXX" />
            <button className="btn"><Icon n="check" size={18} /> পেমেন্ট জমা দিন</button>
            <p className="sub" style={{ margin: '10px 0 0', fontSize: 13 }}>ভুল বা ভুয়া TrxID দিলে অনুরোধ বাতিল হবে।</p>
          </form>
        </>
      )}
    </AccountShell>
  );
}
