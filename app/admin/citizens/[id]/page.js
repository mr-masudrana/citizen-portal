import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isAdmin, dt } from '../../../../lib/admin';
import { getCitizen, patchCitizen, byCitizen, docUrls, rpc, txByCitizen } from '../../../../lib/db';
import { percent, missing } from '../../../../lib/auth';
import { Icon } from '../../../../lib/icons';
import { AccountBadge } from '../../../../lib/badge';
import { bn } from '../../../../lib/templates';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
async function toggle(fd) {
  'use server';
  if (!isAdmin()) return;
  const id = String(fd.get('id'));
  await patchCitizen(id, { blocked: fd.get('s') === 'block' });
  revalidatePath(`/admin/citizens/${id}`);
  redirect(`/admin/citizens/${id}?ok=1`);
}
async function adjust(fd) {
  'use server';
  if (!isAdmin()) return;
  const id = String(fd.get('id')), amt = Number(fd.get('amount')), note = String(fd.get('note') || '').trim().slice(0, 150);
  const back = `/admin/citizens/${id}`;
  if (!/^[0-9a-f-]{36}$/.test(id) || !Number.isInteger(amt) || amt === 0 || Math.abs(amt) > 100000 || !note) redirect(`${back}?e=adj`);
  if ((await rpc('wallet_apply', { p_citizen: id, p_amount: amt, p_type: 'adjust', p_ref: null, p_note: note })) === -1) redirect(`${back}?e=low`);
  revalidatePath(back);
  redirect(`${back}?ok=1`);
}
const Row = ({ l, v }) => <div className="kv"><span>{l}</span><b>{v || '—'}</b></div>;
export default async function CitizenDetail({ params, searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const c = await getCitizen(params.id);
  if (!c) notFound();
  const [apps, [ph]] = await Promise.all([byCitizen(c.id), c.photo ? docUrls([c.photo]) : [null]]);
  const pc = percent(c), miss = missing(c);
  const tx = await txByCitizen(c.id, 10);
  return (
    <>
      <p className="sub" style={{ margin: 0 }}><a href="/admin/citizens">← নাগরিক</a></p>
      {sp.ok && <p className="badge ok">কাজটি সম্পন্ন হয়েছে।</p>}
      <div className="card dash-pro">
        {ph?.url ? <img className="dp-av" src={ph.url} alt="নাগরিকের ছবি" /> : <div className="pf-ini dp-av" aria-hidden="true">{[...(c.name_bn || c.name || '?')][0]}</div>}
        <div className="dp-info"><div className="dp-name">{c.name_bn || c.name}</div><div style={{ margin: '0 0 6px', display: 'flex', flexWrap: 'wrap', gap: 6 }}><AccountBadge u={c} /></div>
          <div className="dp-line"><Icon n="mail" size={17} />{c.email}<span className={`badge ${c.email_verified ? 'ok' : 'warn'}`}>{c.email_verified ? 'যাচাইকৃত' : 'যাচাই বাকি'}</span></div>
          <div className="dp-line"><Icon n="phone" size={17} />{c.mobile ? bn(c.mobile) : 'মোবাইল নেই'}</div></div>
        <form action={toggle} className="dp-act"><input type="hidden" name="id" value={c.id} />
          {c.blocked ? <button className="btn" name="s" value="unblock" style={{ margin: 0 }}><Icon n="check" size={17} /> আনব্লক করুন</button> : <button className="btn red" name="s" value="block" style={{ margin: 0 }}><Icon n="ban" size={17} /> ব্লক করুন</button>}
        </form>
      </div>
      {c.blocked && <p className="badge bad">এই অ্যাকাউন্টটি ব্লক করা আছে, নাগরিক লগইন করতে পারবেন না।</p>}
      {sp.e === 'adj' && <p className="badge bad">সংখ্যা (পূর্ণ টাকা, ঋণাত্মক হলে কাটা) ও কারণ দিন।</p>}
      {sp.e === 'low' && <p className="badge bad">ব্যালেন্সের চেয়ে বেশি কাটা যাবে না।</p>}
      <section className="card adm-sec">
        <div className="sec-h"><h2>ওয়ালেট: ৳{bn(c.balance || 0)}</h2></div>
        <form action={adjust} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input type="hidden" name="id" value={c.id} />
          <input name="amount" type="number" step="1" placeholder="±টাকা (যেমন 100 বা -50)" aria-label="টাকা" required style={{ width: 190 }} />
          <input name="note" placeholder="কারণ (বাধ্যতামূলক)" aria-label="কারণ" required style={{ flex: '1 1 200px', width: 'auto' }} />
          <button className="btn sm" style={{ margin: 0 }}><Icon n="check" size={15} /> সমন্বয় করুন</button>
        </form>
        {tx.length > 0 && <div className="tbl" style={{ marginTop: 12 }}><table style={{ minWidth: 0 }}><tbody>{tx.map((t) => <tr key={t.id}><td><small>{dt(t.created_at)}</small></td><td>{t.type}</td><td><b>{t.amount > 0 ? '+' : '−'}৳{bn(Math.abs(t.amount))}</b></td><td><small>{[t.note, t.ref].filter(Boolean).join(' · ')}</small></td></tr>)}</tbody></table></div>}
      </section>
      <div className="adm-grid">
        <section className="card adm-sec"><h2>প্রোফাইল ({bn(pc)}%)</h2>
          <Row l="নাম (বাংলা / ইংরেজি)" v={[c.name_bn, c.name].filter(Boolean).join(' / ')} />
          <Row l="পিতা" v={[c.father_bn, c.father].filter(Boolean).join(' / ')} /><Row l="পিতার NID" v={c.father_nid && bn(c.father_nid)} />
          <Row l="মাতা" v={[c.mother_bn, c.mother].filter(Boolean).join(' / ')} /><Row l="মাতার NID" v={c.mother_nid && bn(c.mother_nid)} />
          <Row l="জন্ম তারিখ" v={c.dob && bn(c.dob.split('-').reverse().join('/'))} /><Row l="NID / জন্ম নিবন্ধন" v={c.nid && bn(c.nid)} />
          <Row l="ঠিকানা" v={[c.holding && `বাসা/হোল্ডিং ${c.holding}`, c.village, c.ward && `ওয়ার্ড ${c.ward}`, c.post && `${c.post}${c.post_code ? '-' + c.post_code : ''}`, c.union_name, c.upazila, c.district, c.division].filter(Boolean).join(', ')} />
          <Row l="নিবন্ধনের সময়" v={dt(c.created_at)} />
          {miss.length > 0 && <p className="sub" style={{ margin: '12px 0 0' }}>বাকি আছে: {miss.map(([, l]) => l).join(', ')}</p>}
        </section>
        <section className="card adm-sec"><h2>আবেদনসমূহ ({bn(apps.length)})</h2>
          {apps.length === 0 ? <p className="sub">কোনো আবেদন নেই।</p> : apps.map((a) => (
            <a key={a.no} className="adm-li" href={`/admin/applications/${a.no}`}><b>{a.service}</b><span>{a.no} · <span className={`badge ${ST[a.status][1]}`}>{ST[a.status][0]}</span></span></a>
          ))}
        </section>
      </div>
    </>
  );
}
