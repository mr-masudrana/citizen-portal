import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { add, uploadDocs, badFile } from '../../lib/db';
import { SERVICES } from '../../lib/services';
const LIST = SERVICES.filter((s) => s !== 'ওয়ারিশ সনদ'); // ওয়ারিশ সনদের আলাদা ফরম: /warish

async function submit(fd) {
  'use server';
  const g = (k) => String(fd.get(k) || '').trim();
  const r = { service: g('service'), name: g('name'), father: g('father'), mother: g('mother'), dob: g('dob'), nid: g('nid'), mobile: g('mobile'), village: g('village'), ward: g('ward'), post: g('post') };
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (!LIST.includes(r.service) || !r.name || !r.father || !/^01\d{9}$/.test(r.mobile)) redirect('/apply?error=1');
  if (badFile(files)) redirect('/apply?error=file');
  const no = 'S' + randomBytes(4).toString('hex').toUpperCase();
  const paths = await uploadDocs(no, files);
  await add({ ...r, no, status: 'pending', createdAt: new Date().toISOString(), files: paths });
  redirect(`/track?no=${no}&mobile=${r.mobile}`);
}

const Field = ({ l, n, ph, req = true, type = 'text' }) => (
  <div><label htmlFor={n}>{l}</label><input id={n} name={n} type={type} placeholder={ph} required={req} /></div>
);

export default function Apply({ searchParams }) {
  return (
    <div className="page">
      <h1>সনদের আবেদন</h1>
      <p className="sub">সব তথ্য আবেদনকারীর কাগজপত্র দেখে নির্ভুলভাবে লিখুন। ওয়ারিশ সনদের জন্য <a href="/warish">এই ফরম</a> ব্যবহার করুন।</p>
      {searchParams.error === 'file' && <p className="badge bad">ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।</p>}
      {searchParams.error === '1' && <p className="badge bad">তথ্য ঠিক নেই। নাম, পিতার নাম ও ১১ ডিজিটের মোবাইল নম্বর (01XXXXXXXXX) দিন।</p>}
      <form className="card" action={submit}>
        <label htmlFor="service">সনদের ধরন</label>
        <select id="service" name="service" defaultValue={searchParams.service || LIST[1]}>{LIST.map((s) => <option key={s}>{s}</option>)}</select>
        <div className="row">
          <Field l="আবেদনকারীর নাম" n="name" ph="নাম" /><Field l="পিতার নাম" n="father" ph="পিতার নাম" />
          <Field l="মাতার নাম" n="mother" ph="মাতার নাম" req={false} /><Field l="জন্ম তারিখ" n="dob" type="date" req={false} />
          <Field l="NID / জন্ম নিবন্ধন নম্বর" n="nid" ph="নম্বর" req={false} /><Field l="মোবাইল নম্বর" n="mobile" ph="01XXXXXXXXX" />
          <Field l="গ্রাম / মহল্লা" n="village" ph="গ্রাম" req={false} /><Field l="ওয়ার্ড নং" n="ward" ph="ওয়ার্ড" req={false} /><Field l="ডাকঘর" n="post" ph="ডাকঘর" req={false} />
        </div>
        <label htmlFor="docs">ছবি ও NID-এর কপি (সর্বোচ্চ ৩টি, প্রতিটি ১ MB পর্যন্ত; JPG, PNG, PDF)</label>
        <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" />
        <button className="btn">আবেদন জমা দিন</button>
      </form>
    </div>
  );
}
