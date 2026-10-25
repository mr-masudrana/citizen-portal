import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { add, delApp, uploadDocs, badFile } from '../../lib/db';
import { feeFor, charge } from '../../lib/wallet';
import FeeNote from '../FeeNote';
import { requireCitizen, ready } from '../../lib/auth';
import HeirList from './HeirList';
import { HEIR } from '../../lib/services';

async function submit(fd) {
  'use server';
  const u = await requireCitizen('/warish');
  if (!ready(u)) redirect('/profile?need=1');
  const g = (k) => String(fd.get(k) || '').trim();
  const service = HEIR.includes(g('service')) ? g('service') : HEIR[0];
  const names = fd.getAll('h_name'), rels = fd.getAll('h_rel'), nids = fd.getAll('h_nid');
  const heirs = names.map((n, i) => ({ name: String(n).trim(), rel: String(rels[i] || ''), nid: String(nids[i] || '').trim() })).filter((h) => h.name);
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (!g('dname') || !heirs.length) redirect('/warish?error=1');
  if (badFile(files)) redirect('/warish?error=file');
  const fee = await feeFor(service);
  if ((u.balance || 0) < fee) redirect(`/warish?service=${encodeURIComponent(service)}&error=bal`);
  const no = 'S' + randomBytes(4).toString('hex').toUpperCase();
  const paths = await uploadDocs(no, files);
  await add({ fee, no, service, citizen_id: u.id, name: u.name, father: u.father, mother: u.mother, name_bn: u.name_bn, father_bn: u.father_bn, mother_bn: u.mother_bn, father_nid: u.father_nid, mother_nid: u.mother_nid, holding: u.holding, post_code: u.post_code, dob: u.dob, nid: u.nid, mobile: u.mobile, village: u.village, ward: u.ward, post: u.post, division: u.division, district: u.district, upazila: u.upazila, union_name: u.union_name, status: 'pending', createdAt: new Date().toISOString(), files: paths,
    extra: { dname: g('dname'), dfather: g('dfather'), ddeath: g('ddeath'), dcert: g('dcert'), daddr: g('daddr'), heirs } });
  if (fee && !(await charge(u.id, fee, no, service))) { await delApp(no); redirect(`/warish?service=${encodeURIComponent(service)}&error=bal`); }
  redirect(`/dashboard?ok=1&no=${no}`);
}

const Field = ({ l, n, ph, req = true, type = 'text' }) => (
  <div><label htmlFor={n}>{l}</label><input id={n} name={n} type={type} placeholder={ph} required={req} /></div>
);
const H = ({ children }) => <h2 style={{ margin: '28px 0 6px', fontSize: 20, paddingBottom: 8, borderBottom: '1px solid var(--bd)' }}>{children}</h2>;

export default async function Warish({ searchParams }) {
  const service = HEIR.includes(searchParams.service) ? searchParams.service : HEIR[0];
  const u = await requireCitizen('/warish?service=' + encodeURIComponent(service));
  if (!ready(u)) redirect('/profile?need=1');
  return (
    <div className="page">
      <h1>{service}ের আবেদন</h1>
      <p className="sub">আবেদনকারী: {u.name} ({u.mobile})। মৃত ব্যক্তির তথ্য ও সকল ওয়ারিশের বিবরণ দিন।</p>
      {searchParams.error === 'file' && <p className="badge bad">ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।</p>}
      {searchParams.error === 'bal' && <p className="badge bad">ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। ব্যালেন্স যোগ করে আবার চেষ্টা করুন।</p>}
      {searchParams.error === '1' && <p className="badge bad">মৃত ব্যক্তির নাম এবং অন্তত একজন ওয়ারিশের নাম দিন।</p>}
      <FeeNote service={service} balance={u.balance || 0} />
      <form className="card" action={submit}>
        <input type="hidden" name="service" value={service} />
        <H>মৃত ব্যক্তির তথ্য</H>
        <div className="row"><Field l="নাম" n="dname" ph="মৃত ব্যক্তির নাম" /><Field l="পিতার নাম" n="dfather" ph="পিতার নাম" req={false} /><Field l="মৃত্যুর তারিখ" n="ddeath" type="date" req={false} /><Field l="মৃত্যু সনদ নম্বর" n="dcert" ph="নম্বর" req={false} /><Field l="স্থায়ী ঠিকানা" n="daddr" ph="গ্রাম, ওয়ার্ড, ডাকঘর" req={false} /></div>
        <H>ওয়ারিশদের তালিকা</H>
        <HeirList />
        <H>নথি</H>
        <label htmlFor="docs">মৃত্যু সনদ ও NID-এর কপি (সর্বোচ্চ ৩টি, প্রতিটি ১ MB পর্যন্ত; JPG, PNG, PDF)</label>
        <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" />
        <button className="btn">আবেদন জমা দিন</button>
      </form>
    </div>
  );
}
