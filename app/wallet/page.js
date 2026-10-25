import { requireCitizen } from '../../lib/auth';
import { listTopups, txByCitizen } from '../../lib/db';
import { dt } from '../../lib/admin';
import { Icon } from '../../lib/icons';
import { bn } from '../../lib/templates';
export const dynamic = 'force-dynamic';
const TX = { topup: 'ব্যালেন্স যোগ', fee: 'সেবা ফি', refund: 'ফেরত', adjust: 'অ্যাডমিন সমন্বয়' };
const TS = { pending: ['যাচাই চলছে', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
export default async function Wallet({ searchParams: sp }) {
  const u = await requireCitizen('/wallet');
  const [tx, tops] = await Promise.all([txByCitizen(u.id, 50), listTopups({ citizen: u.id, size: 10 })]);
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1>আমার ওয়ালেট</h1>
      {sp.ok === 'topup' && <p className="badge ok">অনুরোধ জমা হয়েছে। অ্যাডমিন পেমেন্ট যাচাই করলে ব্যালেন্সে যোগ হবে।</p>}
      <div className="card wallet-card" style={{ marginBottom: 20 }}>
        <div className="sec-h" style={{ marginBottom: 0 }}>
          <div><div className="sub" style={{ margin: 0 }}>বর্তমান ব্যালেন্স</div><div className="wal-amt">৳{bn(u.balance || 0)}</div></div>
          <a className="btn" style={{ margin: 0 }} href="/wallet/topup"><Icon n="coins" size={18} /> ব্যালেন্স যোগ করুন</a>
        </div>
        <p className="sub" style={{ margin: '10px 0 0', fontSize: 14 }}>সেবার ফি আবেদন জমা দেওয়ার সময় এখান থেকে কাটা হয়। আবেদন বাতিল হলে ফি ফেরত আসে।</p>
      </div>
      <h2 style={{ fontSize: 22 }}>ব্যালেন্স যোগের অনুরোধ</h2>
      {tops.rows.length === 0 ? <p className="sub">কোনো অনুরোধ নেই।</p> : (
        <div className="tbl"><table><thead><tr><th>সময়</th><th>পরিমাণ</th><th>TrxID</th><th>অবস্থা</th></tr></thead>
          <tbody>{tops.rows.map((t) => <tr key={t.id}><td><small>{dt(t.created_at)}</small></td><td>৳{bn(t.amount)}</td><td>{t.trx_id}</td>
            <td><span className={`badge ${TS[t.status][1]}`}>{TS[t.status][0]}</span>{t.status === 'rejected' && t.note && <><br /><small>কারণ: {t.note}</small></>}</td></tr>)}</tbody></table></div>
      )}
      <h2 style={{ fontSize: 22, marginTop: 28 }}>লেনদেনের ইতিহাস</h2>
      {tx.length === 0 ? <p className="sub">এখনো কোনো লেনদেন নেই।</p> : (
        <div className="tbl"><table><thead><tr><th>সময়</th><th>ধরন</th><th>পরিমাণ</th><th>ব্যালেন্স</th><th>বিবরণ</th></tr></thead>
          <tbody>{tx.map((t) => <tr key={t.id}><td><small>{dt(t.created_at)}</small></td><td>{TX[t.type] || t.type}</td>
            <td className={t.amount > 0 ? 'pos' : 'neg'}><b>{t.amount > 0 ? '+' : '−'}৳{bn(Math.abs(t.amount))}</b></td><td>৳{bn(t.balance_after)}</td><td><small>{[t.note, t.ref].filter(Boolean).join(' · ')}</small></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
