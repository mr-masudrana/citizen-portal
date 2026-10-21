import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isAdmin, decide, dt } from '../../../../lib/admin';
import { get, patch, getCitizen, docUrls } from '../../../../lib/db';
import { EXTRA } from '../../../../lib/services';
import { Icon } from '../../../../lib/icons';
import { bn } from '../../../../lib/templates';
export const dynamic = 'force-dynamic';
const ST = { pending: ['অপেক্ষমাণ', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
async function act(fd) {
  'use server';
  if (!isAdmin()) return;
  const no = String(fd.get('no')), s = String(fd.get('s')), note = String(fd.get('note') || '').trim().slice(0, 300), back = `/admin/applications/${no}`;
  if (s === 'reopen') await patch(no, { status: 'pending', decided_at: null });
  else if (s === 'approved' || s === 'rejected') {
    if (s === 'rejected' && !note) redirect(`${back}?e=note`);
    await decide(no, s, note);
  }
  revalidatePath('/admin', 'layout');
  redirect(`${back}?ok=1`);
}
const Row = ({ l, v }) => <div className="kv"><span>{l}</span><b>{v || '—'}</b></div>;
const Tbl = ({ rows }) => (
  <div className="tbl"><table style={{ minWidth: 0 }}><thead><tr><th>ক্রম</th><th>নাম</th><th>সম্পর্ক</th><th>NID / জন্ম নিবন্ধন</th></tr></thead>
    <tbody>{rows.map((h, i) => <tr key={i}><td>{bn(i + 1)}</td><td>{h.name}</td><td>{h.rel}</td><td>{bn(h.nid) || '—'}</td></tr>)}</tbody></table></div>
);
export default async function AppDetail({ params, searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const a = await get(params.no);
  if (!a) notFound();
  const [c, files, f, [pho]] = await Promise.all([a.citizen_id ? getCitizen(a.citizen_id) : null, docUrls(a.files), a.filed_by ? getCitizen(a.filed_by) : null, a.photo ? docUrls([a.photo]) : [null]]);
  const x = a.extra, st = ST[a.status];
  const addr = [a.holding && `বাসা/হোল্ডিং ${a.holding}`, a.village, a.ward && `ওয়ার্ড ${a.ward}`, a.post && `${a.post}${a.post_code ? '-' + a.post_code : ''}`, a.union_name, a.upazila, a.district, a.division].filter(Boolean).join(', ');
  return (
    <>
      <p className="sub" style={{ margin: 0 }}><a href="/admin/applications">← আবেদনসমূহ</a></p>
      <div className="sec-h"><div><h1>{a.service}</h1><p className="sub" style={{ margin: 0 }}>আবেদন নম্বর: <b>{a.no}</b></p></div><span className={`badge ${st[1]}`} style={{ fontSize: 17, padding: '6px 18px' }}>{st[0]}</span></div>
      {sp.ok && <p className="badge ok">কাজটি সম্পন্ন হয়েছে।</p>}
      {sp.e === 'note' && <p className="badge bad">বাতিলের কারণ (মন্তব্য) লিখুন।</p>}
      <div className="adm-grid">
        <div>
          <section className="card adm-sec"><h2>আবেদনকারী</h2>
            <Row l="নাম (বাংলা)" v={a.name_bn} /><Row l="নাম (ইংরেজি)" v={a.name} />
            <Row l="পিতার নাম" v={[a.father_bn, a.father].filter(Boolean).join(' / ')} /><Row l="পিতার NID" v={a.father_nid && bn(a.father_nid)} />
            <Row l="মাতার নাম" v={[a.mother_bn, a.mother].filter(Boolean).join(' / ')} /><Row l="মাতার NID" v={a.mother_nid && bn(a.mother_nid)} />
            <Row l="জন্ম তারিখ" v={a.dob && bn(a.dob.split('-').reverse().join('/'))} /><Row l="NID / জন্ম নিবন্ধন" v={a.nid && bn(a.nid)} />
            <Row l="মোবাইল" v={a.mobile && bn(a.mobile)} /><Row l="ইমেইল" v={c?.email} /><Row l="স্থায়ী ঠিকানা" v={addr} />
            {f && <Row l="দাখিলকারী উদ্যোক্তা" v={<a href={`/admin/entrepreneurs/${f.id}`}>{f.name_bn || f.name} ({f.ent_data?.center || f.email})</a>} />}
            {a.consent_at && <Row l="আবেদনকারীর সম্মতি" v={`নেওয়া হয়েছে (${dt(a.consent_at)})`} />}
            {pho?.url && <div style={{ marginTop: 12 }}><img src={pho.url} alt="আবেদনকারীর ছবি" width="110" height="138" style={{ objectFit: 'cover', borderRadius: 10, border: '1px solid var(--bd)' }} /></div>}
            {c && <p style={{ margin: '14px 0 0' }}><a className="btn out sm" href={`/admin/citizens/${c.id}`}><Icon n="user" size={15} /> নাগরিকের প্রোফাইল</a></p>}
          </section>
          {x && !x.heirs && (
            <section className="card adm-sec"><h2>আবেদনের অতিরিক্ত তথ্য</h2>
              {Object.entries(x).filter(([k]) => k !== 'members').map(([k, v]) => <Row key={k} l={(EXTRA[a.service] || []).find((e) => e[0] === k)?.[1] || k} v={String(v)} />)}
              {x.members && <><h3 style={{ fontSize: 17 }}>সদস্যদের তালিকা</h3><Tbl rows={x.members} /></>}
            </section>
          )}
          {x?.heirs && (
            <section className="card adm-sec"><h2>মৃত ব্যক্তি ও ওয়ারিশ</h2>
              <Row l="মৃত ব্যক্তির নাম" v={x.dname} /><Row l="পিতার নাম" v={x.dfather} /><Row l="মৃত্যুর তারিখ" v={x.ddeath && bn(x.ddeath.split('-').reverse().join('/'))} /><Row l="মৃত্যু সনদ নং" v={x.dcert && bn(x.dcert)} /><Row l="স্থায়ী ঠিকানা" v={x.daddr} />
              <h3 style={{ fontSize: 17 }}>ওয়ারিশদের তালিকা</h3><Tbl rows={x.heirs} />
            </section>
          )}
          <section className="card adm-sec"><h2>সংযুক্ত নথি</h2>
            {files.length === 0 ? <p className="sub">কোনো নথি দেওয়া হয়নি।</p> : (
              <div className="adm-files">{files.map((f, i) => (
                <a key={f.p} href={f.url} target="_blank" rel="noreferrer">{/\.(jpe?g|png)$/i.test(f.p) ? <img src={f.url} alt={`নথি ${i + 1}`} /> : <span className="ic"><Icon n="file" /></span>}<small>নথি {bn(i + 1)}</small></a>
              ))}</div>
            )}
          </section>
        </div>
        <div>
          <section className="card adm-sec"><h2>অবস্থা ও কাজ</h2>
            <Row l="আবেদনের সময়" v={dt(a.createdAt)} /><Row l="সিদ্ধান্তের সময়" v={a.decidedAt ? dt(a.decidedAt) : null} /><Row l="মন্তব্য" v={a.admin_note} />
            <form action={act}>
              <input type="hidden" name="no" value={a.no} />
              <label htmlFor="note">মন্তব্য / বাতিলের কারণ (নাগরিক দেখতে পাবেন)</label>
              <textarea id="note" name="note" rows={3} maxLength={300} defaultValue="" />
              <div className="adm-acts">
                {a.status !== 'approved' && <button className="btn" name="s" value="approved"><Icon n="check" size={17} /> অনুমোদন</button>}
                {a.status !== 'rejected' && <button className="btn red" name="s" value="rejected"><Icon n="x" size={17} /> বাতিল</button>}
                {a.status !== 'pending' && <button className="btn out" name="s" value="reopen"><Icon n="clock" size={17} /> আবার অপেক্ষমাণ</button>}
              </div>
              <p className="sub" style={{ margin: '10px 0 0', fontSize: 13 }}>অনুমোদন বা বাতিলে নাগরিকের ইমেইলে জানানো হয়।</p>
            </form>
            {a.status === 'approved' && <a className="btn out" style={{ marginTop: 14 }} href={`/certificate/${a.no}`} target="_blank" rel="noreferrer"><Icon n="eye" size={17} /> সনদ দেখুন ও প্রিন্ট</a>}
          </section>
        </div>
      </div>
    </>
  );
}
