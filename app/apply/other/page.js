import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { requireEnt } from '../../../lib/ent';
import { uploadDocs, badFile, badPhoto } from '../../../lib/db';
import { feeFor, placeApplication } from '../../../lib/wallet';
import FeeNote from '../../FeeNote';
import { SERVICES, EXTRA, MEMBERS, HEIR, ICON } from '../../../lib/services';
import { parseExtra } from '../../../lib/apply';
import { fromIds } from '../../../lib/geo';
import { Icon } from '../../../lib/icons';
import HeirList from '../../warish/HeirList';
import AddressPicker from '../../profile/AddressPicker';
const BN = /^[\u0980-\u09FF\s.\-]+$/, NID = /^\d{10,17}$/;
const ERR = { bal: 'ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। ব্যালেন্স যোগ করে আবার চেষ্টা করুন।', 1: 'সব বাধ্যতামূলক (*) ঘর পূরণ করুন।', bn: 'বাংলা ঘরগুলো বাংলা অক্ষরে লিখুন।', nid: 'NID/জন্ম নিবন্ধন নম্বর ১০ থেকে ১৭ ডিজিটের সংখ্যা হতে হবে।', mobile: 'মোবাইল নম্বর ১১ ডিজিটের (01XXXXXXXXX) হতে হবে।', addr: 'পোস্ট কোড ৪ ডিজিটের সংখ্যা হতে হবে।', dob: 'জন্ম তারিখ সঠিক ও আজকের আগের হতে হবে।', consent: 'আবেদনকারীর সম্মতি নিয়েছেন, এই ঘরে টিক দিন।', x: 'সেবার অতিরিক্ত তথ্য সঠিকভাবে দিন।', photo: 'আবেদনকারীর JPG বা PNG ছবি দিন, ১ MB-এর মধ্যে।', file: 'অন্তত একটি নথি দিন। ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।' };
async function submit(fd) {
  'use server';
  const u = await requireEnt('/apply/other');
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 120);
  const service = g('service');
  if (!SERVICES.includes(service)) redirect('/apply/other');
  const back = (e) => redirect(`/apply/other?service=${encodeURIComponent(service)}&error=${e}`);
  const loc = fromIds(g('division'), g('district'), g('upazila'), g('union'));
  if (g('union') === '__other') loc.union_name = g('union_other');
  const r = { name: g('name'), name_bn: g('name_bn'), father: g('father'), father_bn: g('father_bn'), father_nid: g('father_nid'), mother: g('mother'), mother_bn: g('mother_bn'), mother_nid: g('mother_nid'), dob: g('dob'), nid: g('nid'), mobile: g('mobile'), holding: g('holding'), village: g('village'), ward: g('ward'), post: g('post'), post_code: g('post_code'), ...loc };
  if (['name', 'name_bn', 'father', 'father_bn', 'mother', 'mother_bn', 'dob', 'nid', 'division', 'district', 'upazila', 'union_name', 'village', 'ward', 'post', 'post_code'].some((k) => !r[k])) back('1');
  if ([r.name_bn, r.father_bn, r.mother_bn].some((x) => !BN.test(x))) back('bn');
  if (!NID.test(r.nid) || [r.father_nid, r.mother_nid].some((x) => x && !NID.test(x))) back('nid');
  if (r.mobile && !/^01\d{9}$/.test(r.mobile)) back('mobile');
  if (!/^\d{4}$/.test(r.post_code)) back('addr');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dob) || new Date(r.dob) > new Date()) back('dob');
  if (!fd.get('consent')) back('consent');
  const extra = parseExtra(fd, service);
  if (!extra) back('x');
  const photo = fd.get('photo');
  if (await badPhoto(photo)) back('photo');
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (!files.length || (await badFile(files))) back('file');
  const fee = await feeFor(service);
  if ((u.balance || 0) < fee) back('bal');
  const no = 'S' + randomBytes(4).toString('hex').toUpperCase();
  const now = new Date().toISOString();
  const res = await placeApplication({ payer: u.id, fee, no, service,
    upload: async (bag) => { const paths = await uploadDocs(no, files, bag); const [pp] = await uploadDocs(no + 'p', [photo], bag); return { files: paths, photo: pp }; },
    row: { filed_by: u.id, consent_at: now, ...r, status: 'pending', createdAt: now, extra: Object.keys(extra).length ? extra : null } });
  if (res === 'bal') back('bal');
  redirect(`/dashboard?tab=filed&ok=1&no=${no}`);
}
const F = ({ l, n, ph, req, type = 'text', pattern, title }) => (
  <div><label htmlFor={n}>{l}{req && <span className="req"> *</span>}</label><input id={n} name={n} type={type} placeholder={ph} required={req} pattern={pattern} title={title} /></div>
);
const H = ({ children }) => <h2 style={{ margin: '28px 0 6px', fontSize: 20, paddingBottom: 8, borderBottom: '1px solid var(--bd)' }}>{children}</h2>;
const BNP = '[\\u0980-\\u09FF\\s.\\-]+';
export default async function EntApply({ searchParams: sp }) {
  const service = sp.service;
  const u = await requireEnt('/apply/other' + (service ? `?service=${encodeURIComponent(service)}` : ''));
  if (!SERVICES.includes(service)) return (
    <div className="page"><h1>কোন সনদের জন্য আবেদন?</h1><p className="sub">সেবা বেছে নিন, তারপর আবেদনকারীর তথ্য দিন।</p>
      <div className="grid">{SERVICES.map((s, i) => <a key={s} className="svc" style={{ '--n': i }} href={`/apply/other?service=${encodeURIComponent(s)}`}><span className="ic"><Icon n={ICON[s] || 'file'} /></span><span className="svc-t">{s}</span><Icon n="arrow" size={16} className="go" /></a>)}</div>
    </div>
  );
  const ex = EXTRA[service] || [];
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1>{service}</h1>
      <p className="sub">আপনি আবেদনকারীর হয়ে তাঁর তথ্য দিচ্ছেন। তথ্য মিলিয়ে নিন, কারণ জমা দেওয়ার পর বদলানো যায় না। <a href="/apply/other">অন্য সেবা বেছে নিন</a></p>
      {ERR[sp.error] && <p className="badge bad">{ERR[sp.error]}</p>}
      <FeeNote service={service} balance={u.balance || 0} />
      <form className="card" action={submit}>
        <input type="hidden" name="service" value={service} />
        <H>আবেদনকারীর তথ্য</H>
        <div className="row">
          <F l="নাম (বাংলা)" n="name_bn" req pattern={BNP} title="বাংলা অক্ষরে লিখুন" /><F l="নাম (ইংরেজি)" n="name" req />
          <F l="পিতার নাম (বাংলা)" n="father_bn" req pattern={BNP} title="বাংলা অক্ষরে লিখুন" /><F l="পিতার নাম (ইংরেজি)" n="father" req />
          <F l="পিতার NID (ঐচ্ছিক)" n="father_nid" pattern="\d{10,17}" title="১০–১৭ ডিজিট" />
          <F l="মাতার নাম (বাংলা)" n="mother_bn" req pattern={BNP} title="বাংলা অক্ষরে লিখুন" /><F l="মাতার নাম (ইংরেজি)" n="mother" req />
          <F l="মাতার NID (ঐচ্ছিক)" n="mother_nid" pattern="\d{10,17}" title="১০–১৭ ডিজিট" />
          <F l="জন্ম তারিখ" n="dob" type="date" req /><F l="NID / জন্ম নিবন্ধন নম্বর" n="nid" req pattern="\d{10,17}" title="১০–১৭ ডিজিটের সংখ্যা" />
          <F l="মোবাইল নম্বর (ঐচ্ছিক)" n="mobile" pattern="01\d{9}" title="01XXXXXXXXX" />
        </div>
        <H>স্থায়ী ঠিকানা</H>
        <div className="row">
          <AddressPicker init={{ division: '', district: '', upazila: '', union: '' }} other="" />
          <F l="বাসা/হোল্ডিং নং (ঐচ্ছিক)" n="holding" /><F l="গ্রাম / মহল্লা" n="village" req /><F l="ওয়ার্ড নং" n="ward" req />
          <F l="পোস্ট অফিস" n="post" req /><F l="পোস্ট কোড" n="post_code" req pattern="\d{4}" title="৪ ডিজিট" />
        </div>
        {(ex.length > 0 || MEMBERS.includes(service) || HEIR.includes(service)) && <H>{service}ের অতিরিক্ত তথ্য</H>}
        {ex.length > 0 && <div className="row">{ex.map(([k, l, type]) => <div key={k}><label htmlFor={`x_${k}`}>{l} <span className="req">*</span></label><input id={`x_${k}`} name={`x_${k}`} type={type === 'number' ? 'number' : 'text'} min={type === 'number' ? 1 : undefined} required /></div>)}</div>}
        {MEMBERS.includes(service) && <><p className="sub" style={{ margin: '0 0 8px' }}>পরিবারের সদস্যদের তালিকা</p><HeirList noun="সদস্য" /></>}
        {HEIR.includes(service) && (
          <>
            <div className="row"><F l="মৃত ব্যক্তির নাম" n="dname" req /><F l="মৃত ব্যক্তির পিতার নাম" n="dfather" /><F l="মৃত্যুর তারিখ" n="ddeath" type="date" /><F l="মৃত্যু সনদ নম্বর" n="dcert" /><F l="মৃত ব্যক্তির স্থায়ী ঠিকানা" n="daddr" /></div>
            <p className="sub" style={{ margin: '14px 0 8px' }}>ওয়ারিশদের তালিকা</p><HeirList />
          </>
        )}
        <H>আবেদনকারীর ছবি ও নথি</H>
        <p className="sub" style={{ margin: '0 0 6px' }}>এগুলো আবেদনকারীর (যার জন্য আবেদন করছেন)। উদ্যোক্তা হিসেবে আপনার নিজের কোনো নথি লাগবে না।</p>
        <label htmlFor="photo">আবেদনকারীর ছবি <span className="req">*</span> (JPG বা PNG, ১ MB পর্যন্ত)</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png" required />
        <label htmlFor="docs">আবেদনকারীর NID বা জন্ম নিবন্ধনের কপিসহ সহায়ক নথি <span className="req">*</span> (সর্বোচ্চ ৩টি, প্রতিটি ১ MB; JPG, PNG, PDF)</label>
        <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" required />
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400, marginTop: 20 }}><input type="checkbox" name="consent" required style={{ width: 'auto', marginTop: 5 }} />
          <span>আমি আবেদনকারীর সম্মতি নিয়ে তাঁর তথ্য দিচ্ছি এবং দেওয়া সব তথ্য সঠিক।</span></label>
        <button className="btn"><Icon n="check" size={18} /> আবেদন জমা দিন</button>
      </form>
    </div>
  );
}
