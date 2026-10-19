import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCitizen, percent, FIELDS } from '../../lib/auth';
import { patchCitizen, uploadPhoto, docUrls, getByEmail } from '../../lib/db';
import { sendVerifyMail } from '../../lib/mailers';
import { bn } from '../../lib/templates';
import PhotoPick from './PhotoPick';
import AddressPicker from './AddressPicker';
import { fromIds, toIds } from '../../lib/geo';

async function save(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 120);
  const loc = fromIds(g('division'), g('district'), g('upazila'), g('union'));
  if (g('union') === '__other') loc.union_name = g('union_other');
  const p = { name: g('name'), father: g('father'), mother: g('mother'), dob: g('dob'), nid: g('nid'), ...loc, village: g('village'), ward: g('ward'), post: g('post') };
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

async function saveEmail(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const email = String(fd.get('email') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) redirect('/profile?mail=bad');
  if (email === u.email) redirect('/profile');
  const other = await getByEmail(email);
  if (other && other.id !== u.id) redirect('/profile?mail=dup');
  await patchCitizen(u.id, { email, email_verified: false });
  redirect('/profile?mail=' + (await sendVerifyMail({ ...u, email })));
}
async function resend() {
  'use server';
  const u = await requireCitizen('/profile');
  redirect('/profile?mail=' + (u.email ? await sendVerifyMail(u) : 'bad'));
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
      <circle cx="64" cy="64" r="52" fill="none" className="ring-fg" stroke="#0B5D3B" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(c * pc) / 100} ${c}`} transform="rotate(-90 64 64)" />
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
      {searchParams.need && <p className="badge warn">সেবার আবেদন করতে আগে প্রোফাইল ১০০% সম্পূর্ণ করতে এবং ইমেইল যাচাই করতে হবে।</p>}
      {searchParams.saved && <p className="badge ok">প্রোফাইল সংরক্ষণ হয়েছে।</p>}
      {searchParams.error === '1' && <p className="badge bad">নাম দিন। NID/জন্ম নিবন্ধন নম্বর ১০ থেকে ১৭ ডিজিটের সংখ্যা এবং জন্ম তারিখ আজকের আগের হতে হবে।</p>}
      {searchParams.error === 'photo' && <p className="badge bad">ছবি JPG বা PNG এবং ১ MB-এর মধ্যে হতে হবে।</p>}
      <section className="card pf-sec">
        <h2>ইমেইল ও নিরাপত্তা</h2>
        {searchParams.mail === 'sent' && <p className="badge ok">যাচাইয়ের ইমেইল পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।</p>}
        {searchParams.mail === 'wait' && <p className="badge warn">১ মিনিট পরে আবার চেষ্টা করুন।</p>}
        {searchParams.mail === 'dup' && <p className="badge bad">এই ইমেইল অন্য একটি অ্যাকাউন্টে আছে।</p>}
        {searchParams.mail === 'bad' && <p className="badge bad">সঠিক ইমেইল ঠিকানা দিন।</p>}
        {searchParams.mail === 'fail' && <p className="badge bad">ইমেইল পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>}
        {searchParams.verified && <p className="badge ok">ইমেইল যাচাই সম্পন্ন হয়েছে।</p>}
        <form action={saveEmail} className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label htmlFor="email">ইমেইল ঠিকানা{u.email_verified ? <span className="tick"> ✓ যাচাই হয়েছে</span> : u.email ? <span style={{ color: '#7A4E00' }}> (যাচাই বাকি)</span> : null}</label>
            <input id="email" name="email" type="email" defaultValue={u.email || ''} required />
          </div>
          <div style={{ flex: '0 0 auto' }}><button className="btn" style={{ margin: 0 }}>{u.email ? 'ইমেইল সংরক্ষণ' : 'ইমেইল যোগ করুন'}</button></div>
        </form>
        {u.email && !u.email_verified && <form action={resend}><button className="btn out">যাচাইয়ের ইমেইল আবার পাঠান</button></form>}
      </section>
      <div className="pf">
        <aside className="card pf-aside">
          {ph?.url ? <img className="pf-av" src={ph.url} alt="আপনার ছবি" /> : <div className="pf-ini" aria-hidden="true">{[...(u.name || '?')][0]}</div>}
          <div style={{ fontWeight: 700, fontSize: 19 }}>{u.name}</div>
          <div className="sub" style={{ margin: 0 }}>{u.mobile}</div>
          <div style={{ margin: '14px 0 6px' }}><Ring pc={pc} /></div>
          {pc === 100 && u.email_verified
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
            <AddressPicker init={toIds(u)} other={u.union_name} /><F l="গ্রাম / মহল্লা" n="village" v={u.village} />
            <F l="ওয়ার্ড নং" n="ward" v={u.ward} /><F l="ডাকঘর" n="post" v={u.post} />
          </Sec>
          <section className="card pf-sec"><h2>ছবি</h2><p className="sub" style={{ margin: '2px 0 12px' }}>প্রোফাইল ছবি সংরক্ষণের আগে এখানেই দেখতে পাবেন।</p><PhotoPick current={ph?.url} /></section>
          <div className="savebar"><span className="sub" style={{ margin: 0 }}>সংরক্ষণ করলে সম্পূর্ণতা নতুন করে হিসাব হবে।</span><button className="btn" style={{ margin: 0 }}>প্রোফাইল সংরক্ষণ করুন</button></div>
        </form>
      </div>
    </div>
  );
}
