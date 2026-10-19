import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCitizen, percent, FIELDS } from '../../lib/auth';
import { patchCitizen, uploadPhoto, deleteDocs, docUrls } from '../../lib/db';
import { bn } from '../../lib/templates';
import PhotoPick from './PhotoPick';

async function save(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 120);
  const p = { name: g('name'), father: g('father'), mother: g('mother'), dob: g('dob'), nid: g('nid'), district: g('district'), upazila: g('upazila'), union_name: g('union_name'), village: g('village'), ward: g('ward'), post: g('post') };
  const validDob = !p.dob || (/^\d{4}-\d{2}-\d{2}$/.test(p.dob) && Number.isFinite(new Date(`${p.dob}T00:00:00Z`).getTime()) && new Date(`${p.dob}T00:00:00Z`).toISOString().slice(0, 10) === p.dob && new Date(`${p.dob}T00:00:00Z`) <= new Date());
  if (!p.name || p.name.length > 120 || (p.nid && !/^\d{10,17}$/.test(p.nid)) || !validDob) redirect('/profile?error=1');
  const f = fd.get('photo');
  if (f && f.size > 0) {
    if (!['image/jpeg', 'image/png'].includes(f.type) || f.size > 1048576) redirect('/profile?error=photo');
    p.photo = await uploadPhoto(u.id, f);
  }
  try {
    await patchCitizen(u.id, p);
  } catch (error) {
    if (p.photo && p.photo !== u.photo) { try { await deleteDocs([p.photo]); } catch { /* keep original database error */ } }
    throw error;
  }
  revalidatePath('/profile');
  redirect('/profile?saved=1');
}

const F = ({ l, n, v, type = 'text', ph }) => (
  <div>
    <label htmlFor={n}>{l}{v ? <span className="tick" role="img" aria-label="পূরণ করা হয়েছে"> ✓</span> : null}</label>
    <input id={n} name={n} type={type} defaultValue={v || ''} placeholder={ph} />
  </div>
);
const Sec = ({ t, d, children }) => (
  <section className="card pf-sec"><h2>{t}</h2><p className="sub" style={{ margin: '2px 0 4px' }}>{d}</p><div className="row">{children}</div></section>
);
function Ring({ pc }) {
  const c = 2 * Math.PI * 52;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`প্রোফাইল ${bn(pc)}% সম্পূর্ণ`}>
      <circle cx="64" cy="64" r="52" fill="none" stroke="#E6F0EA" strokeWidth="12" />
      <circle cx="64" cy="64" r="52" fill="none" stroke="#0B5D3B" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(c * pc) / 100} ${c}`} transform="rotate(-90 64 64)" />
      <text x="64" y="73" textAnchor="middle" fontSize="26" fontWeight="700" fill="#14231B">{bn(pc)}%</text>
    </svg>
  );
}

export default async function Profile({ searchParams }) {
  const u = await requireCitizen('/profile');
  const pc = percent(u);
  const [ph] = u.photo ? await docUrls([u.photo]) : [];
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>আমার প্রোফাইল</h1>
      <p className="sub">আপনার তথ্য একবার দিন, প্রতিটি আবেদনে তা নিজে থেকে যাবে।</p>
      {searchParams.need && <p className="badge warn">সেবার আবেদন করতে আগে প্রোফাইল ১০০% সম্পূর্ণ করতে হবে।</p>}
      {searchParams.saved && <p className="badge ok">প্রোফাইল সংরক্ষণ হয়েছে।</p>}
      {searchParams.error === '1' && <p className="badge bad">নাম দিন। NID/জন্ম নিবন্ধন নম্বর ১০ থেকে ১৭ ডিজিটের সংখ্যা এবং জন্ম তারিখ আজকের আগের হতে হবে।</p>}
      {searchParams.error === 'photo' && <p className="badge bad">ছবি JPG বা PNG এবং ১ MB-এর মধ্যে হতে হবে।</p>}
      <div className="pf">
        <aside className="card pf-aside">
          {ph?.url ? <img className="pf-av" src={ph.url} alt="আপনার ছবি" /> : <div className="pf-ini" aria-hidden="true">{[...(u.name || '?')][0]}</div>}
          <div style={{ fontWeight: 700, fontSize: 19 }}>{u.name}</div>
          <div className="sub" style={{ margin: 0 }}>{u.mobile}</div>
          <div style={{ margin: '14px 0 6px' }}><Ring pc={pc} /></div>
          {pc === 100
            ? <><span className="badge ok">প্রোফাইল সম্পূর্ণ</span><br /><a className="btn" href="/#services">সেবার আবেদন করুন</a></>
            : <span className="badge warn">সম্পূর্ণ করতে বাকি আছে</span>}
          <ul className="chk">{FIELDS.map(([k, l]) => <li key={k}><span className={u[k] ? 'on' : 'off'} aria-hidden="true">{u[k] ? '✓' : '○'}</span><span>{l}</span><span className="sr">{u[k] ? ' (পূরণ করা)' : ' (বাকি)'}</span></li>)}</ul>
        </aside>
        <form action={save}>
          <Sec t="ব্যক্তিগত তথ্য" d="NID বা জন্ম নিবন্ধনে যেভাবে আছে সেভাবে লিখুন।">
            <F l="নাম" n="name" v={u.name} /><F l="পিতার নাম" n="father" v={u.father} />
            <F l="মাতার নাম" n="mother" v={u.mother} /><F l="জন্ম তারিখ" n="dob" type="date" v={u.dob} />
            <F l="NID / জন্ম নিবন্ধন নম্বর" n="nid" v={u.nid} ph="১০–১৭ ডিজিট" />
            <div><label>মোবাইল নম্বর (লগইন আইডি)</label><input value={u.mobile} readOnly aria-readonly="true" style={{ background: 'var(--bg)' }} /></div>
          </Sec>
          <Sec t="স্থায়ী ঠিকানা" d="সনদে এই ঠিকানা ছাপা হবে।">
            <F l="জেলা" n="district" v={u.district} /><F l="উপজেলা" n="upazila" v={u.upazila} />
            <F l="ইউনিয়ন" n="union_name" v={u.union_name} /><F l="গ্রাম / মহল্লা" n="village" v={u.village} />
            <F l="ওয়ার্ড নং" n="ward" v={u.ward} /><F l="ডাকঘর" n="post" v={u.post} />
          </Sec>
          <section className="card pf-sec"><h2>ছবি</h2><p className="sub" style={{ margin: '2px 0 12px' }}>প্রোফাইল ছবি সংরক্ষণের আগে এখানেই দেখতে পাবেন।</p><PhotoPick current={ph?.url} /></section>
          <div className="savebar"><span className="sub" style={{ margin: 0 }}>সংরক্ষণ করলে সম্পূর্ণতা নতুন করে হিসাব হবে।</span><button className="btn" style={{ margin: 0 }}>প্রোফাইল সংরক্ষণ করুন</button></div>
        </form>
      </div>
    </div>
  );
}
