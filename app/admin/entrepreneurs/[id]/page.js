import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isAdmin, decideEnt, dt } from '../../../../lib/admin';
import { getCitizen, docUrls, byFiler } from '../../../../lib/db';
import { percent } from '../../../../lib/auth';
import { Icon } from '../../../../lib/icons';
import { bn } from '../../../../lib/templates';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'], revoked: ['প্রত্যাহার', 'bad'] };
const AST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
async function act(fd) {
  'use server';
  if (!isAdmin()) return;
  const id = String(fd.get('id')), s = String(fd.get('s')), note = String(fd.get('note') || '').trim().slice(0, 300);
  if (!/^[0-9a-f-]{36}$/.test(id) || !['approved', 'rejected', 'revoked'].includes(s)) return;
  if (s !== 'approved' && !note) redirect(`/admin/entrepreneurs/${id}?e=note`);
  await decideEnt(id, s, note);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/entrepreneurs/${id}?ok=1`);
}
const Row = ({ l, v }) => <div className="kv"><span>{l}</span><b>{v || '—'}</b></div>;
export default async function EntDetail({ params, searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const c = await getCitizen(params.id);
  if (!c || !c.ent_status) notFound();
  const [files, apps] = await Promise.all([docUrls(c.ent_data?.files), byFiler(c.id)]);
  const d = c.ent_data || {}, st = ST[c.ent_status];
  return (
    <>
      <p className="sub" style={{ margin: 0 }}><a href="/admin/entrepreneurs">← উদ্যোক্তা</a></p>
      <div className="sec-h"><div><h1>{c.name_bn || c.name}</h1><p className="sub" style={{ margin: 0 }}>{d.center}</p></div><span className={`badge ${st[1]}`} style={{ fontSize: 17, padding: '6px 18px' }}>{st[0]}</span></div>
      {sp.ok && <p className="badge ok">কাজটি সম্পন্ন হয়েছে।</p>}
      {sp.e === 'note' && <p className="badge bad">বাতিল বা প্রত্যাহারের কারণ (মন্তব্য) লিখুন।</p>}
      <div className="adm-grid">
        <div>
          <section className="card adm-sec"><h2>আবেদনের তথ্য</h2>
            <Row l="প্রতিষ্ঠানের নাম" v={d.center} /><Row l="প্রতিষ্ঠানের ঠিকানা" v={d.address} /><Row l="ট্রেড লাইসেন্স / পরিচয় নম্বর" v={d.license} /><Row l="অভিজ্ঞতা / কারণ" v={d.reason} />
            <Row l="আবেদনের সময়" v={dt(c.ent_at)} /><Row l="মন্তব্য" v={c.ent_note} />
            <h3 style={{ fontSize: 17, marginTop: 18 }}>নথি</h3>
            {files.length === 0 ? <p className="sub">নথি নেই।</p> : <div className="adm-files">{files.map((f, i) => <a key={f.p} href={f.url} target="_blank" rel="noreferrer">{/\.(jpe?g|png)$/i.test(f.p) ? <img src={f.url} alt={`নথি ${i + 1}`} /> : <span className="ic"><Icon n="file" /></span>}<small>নথি {bn(i + 1)}</small></a>)}</div>}
          </section>
          <section className="card adm-sec"><div className="sec-h"><h2>দাখিল করা আবেদন ({bn(apps.length)})</h2>{apps.length > 0 && <a className="btn out sm" href={`/admin/applications?filer=${c.id}`}>সব দেখুন</a>}</div>
            {apps.length === 0 ? <p className="sub">কোনো আবেদন দাখিল করেননি।</p> : apps.slice(0, 8).map((a) => <a key={a.no} className="adm-li" href={`/admin/applications/${a.no}`}><b>{a.service} — {a.name_bn || a.name}</b><span>{a.no} · <span className={`badge ${AST[a.status][1]}`}>{AST[a.status][0]}</span></span></a>)}
          </section>
        </div>
        <div>
          <section className="card adm-sec"><h2>সিদ্ধান্ত</h2>
            <form action={act}>
              <input type="hidden" name="id" value={c.id} />
              <label htmlFor="note" style={{ marginTop: 0 }}>মন্তব্য / কারণ (নাগরিক দেখতে পাবেন)</label>
              <textarea id="note" name="note" rows={3} maxLength={300} />
              <div className="adm-acts">
                {c.ent_status !== 'approved' && <button className="btn" name="s" value="approved"><Icon n="check" size={17} /> অনুমোদন</button>}
                {c.ent_status === 'pending' && <button className="btn red" name="s" value="rejected"><Icon n="x" size={17} /> বাতিল</button>}
                {c.ent_status === 'approved' && <button className="btn red" name="s" value="revoked"><Icon n="ban" size={17} /> অনুমতি প্রত্যাহার</button>}
              </div>
              <p className="sub" style={{ margin: '10px 0 0', fontSize: 13 }}>সিদ্ধান্ত নাগরিকের ইমেইলে জানানো হয়। প্রত্যাহার করলে তিনি আর নতুন আবেদন দাখিল করতে পারবেন না, আগেরগুলো থাকবে।</p>
            </form>
          </section>
          <section className="card adm-sec"><h2>নাগরিকের প্রোফাইল</h2>
            <Row l="ইমেইল" v={c.email} /><Row l="মোবাইল" v={c.mobile && bn(c.mobile)} /><Row l="NID" v={c.nid && bn(c.nid)} /><Row l="প্রোফাইল" v={`${bn(percent(c))}%`} />
            <p style={{ margin: '14px 0 0' }}><a className="btn out sm" href={`/admin/citizens/${c.id}`}><Icon n="user" size={15} /> পুরো প্রোফাইল</a></p>
          </section>
        </div>
      </div>
    </>
  );
}
