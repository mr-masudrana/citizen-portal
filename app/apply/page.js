import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { add, uploadDocs, badFile } from '../../lib/db';
import { requireCitizen, ready } from '../../lib/auth';
import { SERVICES, EXTRA, MEMBERS, HEIR, ICON } from '../../lib/services';
import { Icon } from '../../lib/icons';
import HeirList from '../warish/HeirList';
const LIST = SERVICES.filter((s) => !HEIR.includes(s)); // ওয়ারিশ/উত্তরাধিকার সনদের ফরম: /warish

async function submit(fd) {
  'use server';
  const u = await requireCitizen('/apply');
  if (!ready(u)) redirect('/profile?need=1');
  const g = (k) => String(fd.get(k) || '').trim();
  const service = g('service');
  if (!LIST.includes(service)) redirect('/apply');
  const back = `/apply?service=${encodeURIComponent(service)}`;
  const extra = {};
  for (const [k, , type] of EXTRA[service] || []) {
    const v = g('x_' + k).slice(0, 200);
    if (!v || (type === 'number' && !/^\d{1,10}$/.test(v))) redirect(back + '&error=1');
    extra[k] = v;
  }
  if (MEMBERS.includes(service)) {
    const names = fd.getAll('h_name'), rels = fd.getAll('h_rel'), nids = fd.getAll('h_nid');
    extra.members = names.map((n, i) => ({ name: String(n).trim(), rel: String(rels[i] || ''), nid: String(nids[i] || '').trim() })).filter((h) => h.name);
    if (!extra.members.length) redirect(back + '&error=1');
  }
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (badFile(files)) redirect(back + '&error=file');
  const no = 'S' + randomBytes(4).toString('hex').toUpperCase();
  const paths = await uploadDocs(no, files);
  await add({ no, service, citizen_id: u.id, name: u.name, father: u.father, mother: u.mother, dob: u.dob, nid: u.nid, mobile: u.mobile, village: u.village, ward: u.ward, post: u.post, division: u.division, district: u.district, upazila: u.upazila, union_name: u.union_name, status: 'pending', createdAt: new Date().toISOString(), files: paths, extra: Object.keys(extra).length ? extra : null });
  redirect(`/track?no=${no}&mobile=${u.mobile}`);
}

export default async function Apply({ searchParams }) {
  const service = searchParams.service;
  const u = await requireCitizen('/apply' + (service ? `?service=${encodeURIComponent(service)}` : ''));
  if (!ready(u)) redirect('/profile?need=1');
  if (!LIST.includes(service)) return (
    <div className="page">
      <h1>সেবা নির্বাচন করুন</h1>
      <p className="sub">ওয়ারিশ ও উত্তরাধিকার সনদের জন্য <a href="/warish">এই ফরম</a> ব্যবহার করুন।</p>
      <div className="grid">{LIST.map((s, i) => <a key={s} className="svc" style={{ '--n': i }} href={`/apply?service=${encodeURIComponent(s)}`}><span className="ic"><Icon n={ICON[s] || 'file'} /></span><span className="svc-t">{s}</span><Icon n="arrow" size={16} className="go" /></a>)}</div>
    </div>
  );
  const ex = EXTRA[service] || [];
  return (
    <div className="page">
      <h1>{service}</h1>
      <p className="sub">আপনার প্রোফাইলের তথ্য আবেদনে স্বয়ংক্রিয়ভাবে যাবে। <a href="/apply">অন্য সেবা বেছে নিন</a></p>
      {searchParams.error === 'file' && <p className="badge bad">ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।</p>}
      {searchParams.error === '1' && <p className="badge bad">নিচের সব তথ্য সঠিকভাবে দিন (আয়ের ঘরে শুধু সংখ্যা)।</p>}
      <form className="card" action={submit}>
        <input type="hidden" name="service" value={service} />
        <div className="kv"><span>আবেদনকারী</span><b>{u.name}</b></div>
        <div className="kv"><span>মোবাইল</span><b>{u.mobile}</b></div>
        {ex.length > 0 && <div className="row">{ex.map(([k, l, type]) => <div key={k}><label htmlFor={`x_${k}`}>{l}</label><input id={`x_${k}`} name={`x_${k}`} type={type === 'number' ? 'number' : 'text'} min={type === 'number' ? 1 : undefined} required /></div>)}</div>}
        {MEMBERS.includes(service) && <><h2 style={{ fontSize: 20, margin: '24px 0 6px' }}>পরিবারের সদস্যদের তালিকা</h2><HeirList noun="সদস্য" /></>}
        <label htmlFor="docs">সহায়ক নথি (সর্বোচ্চ ৩টি, প্রতিটি ১ MB পর্যন্ত; JPG, PNG, PDF)</label>
        <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" />
        <button className="btn">আবেদন জমা দিন</button>
      </form>
    </div>
  );
}
