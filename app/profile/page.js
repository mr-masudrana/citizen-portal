import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCitizen, percent, missing } from '../../lib/auth';
import { patchCitizen, uploadPhoto, docUrls } from '../../lib/db';
async function save(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const g = (k) => String(fd.get(k) || '').trim();
  const p = { name: g('name'), father: g('father'), mother: g('mother'), dob: g('dob'), nid: g('nid'), village: g('village'), ward: g('ward'), post: g('post') };
  if (!p.name || (p.nid && !/^\d{10,17}$/.test(p.nid)) || (p.dob && !(/^\d{4}-\d{2}-\d{2}$/.test(p.dob) && new Date(p.dob) <= new Date()))) redirect('/profile?error=1');
  const f = fd.get('photo');
  if (f && f.size > 0) {
    if (!['image/jpeg', 'image/png'].includes(f.type) || f.size > 1048576) redirect('/profile?error=photo');
    p.photo = await uploadPhoto(u.id, f);
  }
  await patchCitizen(u.id, p);
  revalidatePath('/profile');
  redirect('/profile?saved=1');
}
const F = ({ l, n, v, type = 'text', ph }) => <div><label htmlFor={n}>{l}</label><input id={n} name={n} type={type} defaultValue={v || ''} placeholder={ph} /></div>;
export default async function Profile({ searchParams }) {
  const u = await requireCitizen('/profile');
  const pc = percent(u), miss = missing(u);
  const [ph] = u.photo ? await docUrls([u.photo]) : [];
  return (
    <div className="page">
      <h1>আমার প্রোফাইল</h1>
      {searchParams.need && <p className="badge warn">সেবার আবেদন করতে আগে প্রোফাইল ১০০% সম্পূর্ণ করতে হবে।</p>}
      {searchParams.saved && <p className="badge ok">প্রোফাইল সংরক্ষণ হয়েছে।</p>}
      {searchParams.error === '1' && <p className="badge bad">নাম দিন। NID/জন্ম নিবন্ধন নম্বর ১০ থেকে ১৭ ডিজিটের সংখ্যা এবং জন্ম তারিখ আজকের আগের হতে হবে।</p>}
      {searchParams.error === 'photo' && <p className="badge bad">ছবি JPG বা PNG এবং ১ MB-এর মধ্যে হতে হবে।</p>}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>প্রোফাইল সম্পূর্ণতা</span><span>{pc}%</span></div>
        <div className="bar" role="progressbar" aria-valuenow={pc} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pc}%` }} /></div>
        {miss.length > 0 ? <p className="sub" style={{ margin: '10px 0 0' }}>বাকি আছে: {miss.map(([, l]) => l).join(', ')}</p> : <p style={{ margin: '10px 0 0', color: 'var(--g)', fontWeight: 600 }}>আপনার প্রোফাইল সম্পূর্ণ। এখন সেবার আবেদন করতে পারবেন।</p>}
      </div>
      <form className="card" action={save}>
        <div className="kv"><span>মোবাইল নম্বর (লগইন আইডি)</span><b>{u.mobile}</b></div>
        <div className="row">
          <F l="নাম" n="name" v={u.name} /><F l="পিতার নাম" n="father" v={u.father} />
          <F l="মাতার নাম" n="mother" v={u.mother} /><F l="জন্ম তারিখ" n="dob" type="date" v={u.dob} />
          <F l="NID / জন্ম নিবন্ধন নম্বর" n="nid" v={u.nid} ph="১০–১৭ ডিজিট" /><F l="গ্রাম / মহল্লা" n="village" v={u.village} />
          <F l="ওয়ার্ড নং" n="ward" v={u.ward} /><F l="ডাকঘর" n="post" v={u.post} />
        </div>
        <label htmlFor="photo">পাসপোর্ট সাইজ ছবি (JPG/PNG, ১ MB পর্যন্ত)</label>
        {ph?.url && <img src={ph.url} alt="আপনার ছবি" width="96" height="120" style={{ objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 8 }} />}
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png" />
        <button className="btn">প্রোফাইল সংরক্ষণ করুন</button>
      </form>
    </div>
  );
}
