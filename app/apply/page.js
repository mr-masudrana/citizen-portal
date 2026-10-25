import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { uploadDocs, badFile } from '../../lib/db';
import { feeFor, placeApplication } from '../../lib/wallet';
import FeeNote from '../FeeNote';
import { requireCitizen, ready } from '../../lib/auth';
import { SERVICES, EXTRA, MEMBERS, HEIR, ICON } from '../../lib/services';
import { parseExtra } from '../../lib/apply';
import { Icon } from '../../lib/icons';
import HeirList from '../warish/HeirList';
const LIST = SERVICES.filter((s) => !HEIR.includes(s)); // ওয়ারিশ/উত্তরাধিকার সনদের নিজের ফর্ম: /warish

async function submit(fd) {
  'use server';
  const u = await requireCitizen('/apply');
  if (!ready(u)) redirect('/profile?need=1');
  const service = String(fd.get('service') || '').trim();
  if (!LIST.includes(service)) redirect('/apply');
  const back = `/apply?service=${encodeURIComponent(service)}&for=self`;
  const extra = parseExtra(fd, service);
  if (!extra) redirect(back + '&error=1');
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (await badFile(files)) redirect(back + '&error=file');
  const fee = await feeFor(service);
  if ((u.balance || 0) < fee) redirect(back + '&error=bal');
  const no = 'S' + randomBytes(4).toString('hex').toUpperCase();
  const r = await placeApplication({ payer: u.id, fee, no, service, upload: async (bag) => ({ files: await uploadDocs(no, files, bag) }), row: { citizen_id: u.id, name: u.name, father: u.father, mother: u.mother, name_bn: u.name_bn, father_bn: u.father_bn, mother_bn: u.mother_bn, father_nid: u.father_nid, mother_nid: u.mother_nid, holding: u.holding, post_code: u.post_code, dob: u.dob, nid: u.nid, mobile: u.mobile, village: u.village, ward: u.ward, post: u.post, division: u.division, district: u.district, upazila: u.upazila, union_name: u.union_name, status: 'pending', createdAt: new Date().toISOString(), extra: Object.keys(extra).length ? extra : null } });
  if (r === 'bal') redirect(back + '&error=bal');
  redirect(`/dashboard?ok=1&no=${no}`);
}

export default async function Apply({ searchParams: sp }) {
  const service = sp.service;
  const known = SERVICES.includes(service);
  const u = await requireCitizen('/apply' + (known ? `?service=${encodeURIComponent(service)}` : ''));
  const isEnt = u.ent_status === 'approved';
  if (!known) return (
    <div className="page">
      <h1>সেবা নির্বাচন করুন</h1>
      <p className="sub">যে সনদের জন্য আবেদন করবেন সেটি বেছে নিন।</p>
      <div className="grid">{SERVICES.map((s, i) => <a key={s} className="svc" style={{ '--n': i }} href={`/apply?service=${encodeURIComponent(s)}`}><span className="ic"><Icon n={ICON[s] || 'file'} /></span><span className="svc-t">{s}</span><Icon n="arrow" size={16} className="go" /></a>)}</div>
    </div>
  );
  const q = encodeURIComponent(service);
  // উদ্যোক্তা আগে বেছে নেন: নিজের জন্য, নাকি অন্যের জন্য। নাগরিক সরাসরি নিজের ফর্মে যান।
  if (isEnt && sp.for !== 'self') {
    if (sp.for === 'other') redirect(`/apply/other?service=${q}`);
    return (
      <div className="page" style={{ maxWidth: 760 }}>
        <h1>{service}</h1>
        <p className="sub">কার জন্য আবেদন করছেন? <a href="/apply">অন্য সেবা বেছে নিন</a></p>
        <div className="grid two">
          <a className="svc big" style={{ '--n': 0 }} href={`/apply?service=${q}&for=self`}><span className="ic"><Icon n="user" /></span><span className="svc-t"><b>নিজের জন্য</b><small>আপনার প্রোফাইলের তথ্য দিয়ে আবেদন</small></span><Icon n="arrow" size={16} className="go" /></a>
          <a className="svc big" style={{ '--n': 1 }} href={`/apply/other?service=${q}`}><span className="ic"><Icon n="users" /></span><span className="svc-t"><b>অন্যের জন্য</b><small>আবেদনকারীর তথ্য নিজে দিয়ে আবেদন (উদ্যোক্তা সুবিধা)</small></span><Icon n="arrow" size={16} className="go" /></a>
        </div>
      </div>
    );
  }
  if (!ready(u)) redirect('/profile?need=1');
  if (HEIR.includes(service)) redirect(`/warish?service=${q}`);
  const ex = EXTRA[service] || [];
  return (
    <div className="page">
      <h1>{service}</h1>
      <p className="sub">আপনার প্রোফাইলের তথ্য আবেদনে স্বয়ংক্রিয়ভাবে যাবে। {isEnt ? <a href={`/apply?service=${q}`}>নিজের/অন্যের জন্য বদলান</a> : <a href="/apply">অন্য সেবা বেছে নিন</a>}</p>
      {sp.error === 'file' && <p className="badge bad">ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।</p>}
      {sp.error === '1' && <p className="badge bad">নিচের সব তথ্য সঠিকভাবে দিন (আয়ের ঘরে শুধু সংখ্যা)।</p>}
      {sp.error === 'bal' && <p className="badge bad">ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। ব্যালেন্স যোগ করে আবার চেষ্টা করুন।</p>}
      <FeeNote service={service} balance={u.balance || 0} />
      <form className="card" action={submit}>
        <input type="hidden" name="service" value={service} />
        <div className="kv"><span>আবেদনকারী</span><b>{u.name_bn || u.name}</b></div>
        {ex.length > 0 && <div className="row">{ex.map(([k, l, type]) => <div key={k}><label htmlFor={`x_${k}`}>{l}</label><input id={`x_${k}`} name={`x_${k}`} type={type === 'number' ? 'number' : 'text'} min={type === 'number' ? 1 : undefined} required /></div>)}</div>}
        {MEMBERS.includes(service) && <><h2 style={{ fontSize: 20, margin: '24px 0 6px' }}>পরিবারের সদস্যদের তালিকা</h2><HeirList noun="সদস্য" /></>}
        <label htmlFor="docs">সহায়ক নথি (সর্বোচ্চ ৩টি, প্রতিটি ১ MB পর্যন্ত; JPG, PNG, PDF)</label>
        <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" />
        <button className="btn">আবেদন জমা দিন</button>
      </form>
    </div>
  );
}
