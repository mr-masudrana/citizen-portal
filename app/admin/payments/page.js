import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isAdmin, dt } from '../../../lib/admin';
import { listTopups, getTopup, rpc, rejectTopup, getCitizen } from '../../../lib/db';
import { sendMail } from '../../../lib/mail';
import { Icon } from '../../../lib/icons';
import { bn } from '../../../lib/templates';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
async function decide(fd) {
  'use server';
  if (!isAdmin()) return;
  const id = String(fd.get('id')), s = String(fd.get('s')), note = String(fd.get('note') || '').trim().slice(0, 200);
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const t = await getTopup(id);
  if (!t || t.status !== 'pending') redirect('/admin/payments?e=done');
  if (s === 'approved') { if ((await rpc('topup_approve', { p_id: id, p_note: note || null })) === -1) redirect('/admin/payments?e=done'); }
  else { if (!note) redirect('/admin/payments?e=note'); if (!(await rejectTopup(id, note))) redirect('/admin/payments?e=done'); }
  try {
    const c = await getCitizen(t.citizen_id);
    if (c?.email) await sendMail(c.email, `আপনার ব্যালেন্স যোগের অনুরোধ ${s === 'approved' ? 'অনুমোদিত হয়েছে' : 'বাতিল হয়েছে'} – নাগরিক সেবা পোর্টাল`,
      `৳${t.amount} (TrxID: ${t.trx_id}) ${s === 'approved' ? 'আপনার ওয়ালেটে যোগ হয়েছে।' : `বাতিল হয়েছে। কারণ: ${note}`}\n\nওয়ালেট: ${process.env.SITE_URL || 'http://localhost:3000'}/wallet`);
  } catch (e) { console.error('ইমেইল পাঠানো যায়নি:', e.message); }
  revalidatePath('/admin', 'layout');
  redirect('/admin/payments?ok=1');
}
export default async function Payments({ searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const status = sp.status === 'all' ? '' : ST[sp.status] ? sp.status : 'pending';
  const page = Math.max(1, Number(sp.page) || 1), size = 20;
  const { rows, total } = await listTopups({ status, page, size });
  const pages = Math.max(1, Math.ceil(total / size));
  const link = (p, s = status || 'all') => `/admin/payments?status=${s}${p > 1 ? `&page=${p}` : ''}`;
  return (
    <>
      <h1>পেমেন্ট</h1><p className="sub">বাংলা QR-এ আসা ব্যালেন্স যোগের অনুরোধ। আপনার মার্চেন্ট স্টেটমেন্টের সঙ্গে TrxID ও পরিমাণ মিলিয়ে অনুমোদন দিন।</p>
      {sp.ok && <p className="badge ok">কাজটি সম্পন্ন হয়েছে।</p>}
      {sp.e === 'note' && <p className="badge bad">বাতিলের কারণ লিখুন।</p>}
      {sp.e === 'done' && <p className="badge warn">অনুরোধটি আগেই নিষ্পত্তি হয়ে গেছে।</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {[...Object.entries(ST).map(([k, [l]]) => [k, l]), ['all', 'সব']].map(([k, l]) => <a key={k} className={`btn sm ${(status || 'all') === k ? '' : 'out'}`} style={{ margin: 0 }} href={link(1, k)}>{l}</a>)}
      </div>
      <section className="card adm-sec" style={{ padding: 0 }}>
        <div className="tbl"><table>
          <thead><tr><th>সময়</th><th>নাগরিক</th><th>পরিমাণ</th><th>TrxID</th><th>প্রেরক</th><th>অবস্থা / কাজ</th></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id}>
              <td><small>{dt(t.created_at)}</small></td>
              <td><a href={`/admin/citizens/${t.citizen_id}`}><b>{t.citizens?.name_bn || t.citizens?.name}</b></a><br /><small>{t.citizens?.email}</small></td>
              <td><b>৳{bn(t.amount)}</b></td><td>{t.trx_id}</td><td>{t.sender}</td>
              <td>{t.status === 'pending' ? (
                <form action={decide} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <input type="hidden" name="id" value={t.id} /><input name="note" placeholder="মন্তব্য (বাতিলে বাধ্যতামূলক)" aria-label="মন্তব্য" style={{ width: 170 }} />
                  <button className="btn sm" name="s" value="approved" style={{ margin: 0 }}><Icon n="check" size={15} /> অনুমোদন</button>
                  <button className="btn red sm" name="s" value="rejected" style={{ margin: 0 }}><Icon n="x" size={15} /> বাতিল</button>
                </form>
              ) : <><span className={`badge ${ST[t.status][1]}`}>{ST[t.status][0]}</span>{t.note && <><br /><small>{t.note}</small></>}</>}</td>
            </tr>
          ))}</tbody></table></div>
        {rows.length === 0 && <p className="sub" style={{ padding: '0 18px 18px' }}>কোনো অনুরোধ নেই।</p>}
      </section>
      <div className="adm-pager"><a className={`btn out sm ${page <= 1 ? 'off' : ''}`} href={link(page - 1)}>← আগের</a><span>পৃষ্ঠা {bn(page)} / {bn(pages)}</span><a className={`btn out sm ${page >= pages ? 'off' : ''}`} href={link(page + 1)}>পরের →</a></div>
    </>
  );
}
