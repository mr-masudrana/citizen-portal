import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isAdmin, decide, dt } from '../../../lib/admin';
import { listApps } from '../../../lib/db';
import { SERVICES } from '../../../lib/services';
import { Icon } from '../../../lib/icons';
import { bn } from '../../../lib/templates';
import SelectAll from '../SelectAll';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
async function bulk(fd) {
  'use server';
  if (!isAdmin()) return;
  const back = String(fd.get('back') || ''), to = back.startsWith('/admin/') ? back : '/admin/applications';
  const sep = to.includes('?') ? '&' : '?';
  const nos = fd.getAll('no').map(String).slice(0, 50), s = fd.get('s') === 'approved' ? 'approved' : 'rejected', note = String(fd.get('note') || '').trim().slice(0, 300);
  if (!nos.length) redirect(`${to}${sep}e=none`);
  if (s === 'rejected' && !note) redirect(`${to}${sep}e=note`);
  let n = 0;
  for (const no of nos) if (await decide(no, s, note, true)) n++;
  revalidatePath('/admin', 'layout');
  redirect(`${to}${sep}done=${n}`);
}
export default async function Apps({ searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const status = ST[sp.status] ? sp.status : '', service = SERVICES.includes(sp.service) ? sp.service : '', q = String(sp.q || '').slice(0, 60);
  const filer = /^[0-9a-f-]{36}$/.test(sp.filer || '') ? sp.filer : '';
  const page = Math.max(1, Number(sp.page) || 1), size = 20;
  const { rows, total } = await listApps({ status, service, q, filer, page, size });
  const pages = Math.max(1, Math.ceil(total / size));
  const params = new URLSearchParams(Object.entries({ status, service, q, filer }).filter(([, v]) => v));
  const link = (p) => { const x = new URLSearchParams(params); if (p > 1) x.set('page', p); const s = x.toString(); return `/admin/applications${s ? '?' + s : ''}`; };
  return (
    <>
      <div className="sec-h"><div><h1>আবেদনসমূহ</h1><p className="sub" style={{ margin: 0 }}>মোট {bn(total)}টি</p></div>
        <a className="btn out sm" href={`/admin/export${params.toString() ? '?' + params : ''}`}><Icon n="download" size={16} /> CSV ডাউনলোড</a></div>
      {sp.done && <p className="badge ok">{bn(sp.done)}টি আবেদনের কাজ সম্পন্ন হয়েছে।</p>}
      {sp.e === 'none' && <p className="badge warn">আগে আবেদন বেছে নিন।</p>}
      {sp.e === 'note' && <p className="badge bad">বাতিলের কারণ (মন্তব্য) লিখুন।</p>}
      <form className="card adm-filter" method="get">
        <div><label htmlFor="q">খুঁজুন</label><input id="q" name="q" defaultValue={q} placeholder="নম্বর, নাম, NID বা মোবাইল" /></div>
        <div><label htmlFor="status">অবস্থা</label><select id="status" name="status" defaultValue={status}><option value="">সব</option>{Object.entries(ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label htmlFor="service">সেবা</label><select id="service" name="service" defaultValue={service}><option value="">সব</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <button className="btn" style={{ margin: 0 }}><Icon n="search" size={17} /> ফিল্টার</button>
      </form>
      <form action={bulk} className="card adm-sec" style={{ padding: 0 }}>
        <input type="hidden" name="back" value={link(page)} />
        <div className="adm-bulk"><span>নির্বাচিতদের জন্য:</span><input name="note" placeholder="মন্তব্য (বাতিলে বাধ্যতামূলক)" aria-label="মন্তব্য" /><button className="btn sm" name="s" value="approved"><Icon n="check" size={15} /> অনুমোদন</button><button className="btn red sm" name="s" value="rejected"><Icon n="x" size={15} /> বাতিল</button></div>
        <div className="tbl"><table>
          <thead><tr><th><SelectAll /></th><th>নম্বর</th><th>সনদ</th><th>আবেদনকারী</th><th>ঠিকানা</th><th>তারিখ</th><th>অবস্থা</th><th></th></tr></thead>
          <tbody>{rows.map((a) => (
            <tr key={a.no}>
              <td>{a.status === 'pending' && <input type="checkbox" name="no" value={a.no} aria-label={`${a.no} নির্বাচন`} />}</td>
              <td><a href={`/admin/applications/${a.no}`}>{a.no}</a></td><td>{a.service}</td>
              <td><b>{a.name_bn || a.name}</b>{a.filed_by && <span className="badge warn" style={{ marginLeft: 6, fontSize: 12, padding: '1px 8px' }}>উদ্যোক্তা</span>}<br /><small>{a.nid ? `NID: ${bn(a.nid)}` : ''}{a.mobile ? ` · ${bn(a.mobile)}` : ''}</small></td>
              <td><small>{[a.union_name, a.upazila, a.district].filter(Boolean).join(', ') || '—'}</small></td>
              <td><small>{dt(a.createdAt)}</small></td>
              <td><span className={`badge ${ST[a.status][1]}`}>{ST[a.status][0]}</span></td>
              <td><a className="btn out sm" href={`/admin/applications/${a.no}`}><Icon n="eye" size={15} /> দেখুন</a></td>
            </tr>
          ))}</tbody></table></div>
        {rows.length === 0 && <p className="sub" style={{ padding: '0 18px 18px' }}>কোনো আবেদন পাওয়া যায়নি।</p>}
      </form>
      <div className="adm-pager"><a className={`btn out sm ${page <= 1 ? 'off' : ''}`} href={link(page - 1)}>← আগের</a><span>পৃষ্ঠা {bn(page)} / {bn(pages)}</span><a className={`btn out sm ${page >= pages ? 'off' : ''}`} href={link(page + 1)}>পরের →</a></div>
    </>
  );
}
