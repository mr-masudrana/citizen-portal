import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { add, uploadDocs, badFile } from '../../lib/db';
import { requireCitizen, percent } from '../../lib/auth';
import { SERVICES } from '../../lib/services';
const LIST = SERVICES.filter((s) => s !== 'ওয়ারিশ সনদ'); // ওয়ারিশ সনদের আলাদা ফরম: /warish

async function submit(fd) {
  'use server';
  const u = await requireCitizen('/apply');
  if (percent(u) < 100) redirect('/profile?need=1');
  const service = String(fd.get('service') || '');
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (!LIST.includes(service)) redirect('/apply?error=1');
  if (badFile(files)) redirect('/apply?error=file');
  const no = 'S' + randomBytes(4).toString('hex').toUpperCase();
  const paths = await uploadDocs(no, files);
  await add({ no, service, citizen_id: u.id, name: u.name, father: u.father, mother: u.mother, dob: u.dob, nid: u.nid, mobile: u.mobile, village: u.village, ward: u.ward, post: u.post, district: u.district, upazila: u.upazila, union_name: u.union_name, status: 'pending', createdAt: new Date().toISOString(), files: paths });
  redirect(`/track?no=${no}&mobile=${u.mobile}`);
}

export default async function Apply({ searchParams }) {
  const u = await requireCitizen('/apply' + (searchParams.service ? `?service=${encodeURIComponent(searchParams.service)}` : ''));
  if (percent(u) < 100) redirect('/profile?need=1');
  return (
    <div className="page">
      <h1>সনদের আবেদন</h1>
      <p className="sub">আপনার প্রোফাইলের তথ্য আবেদনে স্বয়ংক্রিয়ভাবে যাবে। ওয়ারিশ সনদের জন্য <a href="/warish">এই ফরম</a> ব্যবহার করুন।</p>
      {searchParams.error === 'file' && <p className="badge bad">ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।</p>}
      {searchParams.error === '1' && <p className="badge bad">সনদের ধরন নির্বাচন করুন।</p>}
      <form className="card" action={submit}>
        <div className="kv"><span>আবেদনকারী</span><b>{u.name}</b></div>
        <div className="kv"><span>মোবাইল</span><b>{u.mobile}</b></div>
        <label htmlFor="service">সনদের ধরন</label>
        <select id="service" name="service" defaultValue={searchParams.service || LIST[1]}>{LIST.map((s) => <option key={s}>{s}</option>)}</select>
        <label htmlFor="docs">সহায়ক নথি (সর্বোচ্চ ৩টি, প্রতিটি ১ MB পর্যন্ত; JPG, PNG, PDF)</label>
        <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" />
        <button className="btn">আবেদন জমা দিন</button>
      </form>
    </div>
  );
}
