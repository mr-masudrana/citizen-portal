import { redirect } from 'next/navigation';
import { requireCitizen, percent, FIELDS, hash, verify, startSession } from '../../lib/auth';
import { patchCitizen, uploadPhoto, docUrls, getByEmail, badPhoto } from '../../lib/db';
import { sendOtp, checkOtp } from '../../lib/otp';
import { bn } from '../../lib/templates';
import { fromIds, toIds } from '../../lib/geo';
import { Icon } from '../../lib/icons';
import PhotoPick from './PhotoPick';
import AddressPicker from './AddressPicker';
import { AccountBadge } from '../../lib/badge';

const g = (fd, k) => String(fd.get(k) || '').trim().slice(0, 120);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BN = /^[\u0980-\u09FF\s.\-]+$/; // শুধু বাংলা অক্ষর
const NID = /^\d{10,17}$/;

async function savePersonal(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const p = { name: g(fd, 'name'), name_bn: g(fd, 'name_bn'), father: g(fd, 'father'), father_bn: g(fd, 'father_bn'), father_nid: g(fd, 'father_nid'), mother: g(fd, 'mother'), mother_bn: g(fd, 'mother_bn'), mother_nid: g(fd, 'mother_nid'), dob: g(fd, 'dob'), nid: g(fd, 'nid'), mobile: g(fd, 'mobile') };
  if ([p.name_bn, p.father_bn, p.mother_bn].some((x) => x && !BN.test(x))) redirect('/profile?edit=personal&error=bn');
  if (!p.name || [p.nid, p.father_nid, p.mother_nid].some((x) => x && !NID.test(x)) || (p.mobile && !/^01\d{9}$/.test(p.mobile)) || (p.dob && !(/^\d{4}-\d{2}-\d{2}$/.test(p.dob) && new Date(p.dob) <= new Date()))) redirect('/profile?edit=personal&error=1');
  await patchCitizen(u.id, p);
  redirect('/profile?saved=personal');
}
async function saveAddress(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const loc = fromIds(g(fd, 'division'), g(fd, 'district'), g(fd, 'upazila'), g(fd, 'union'));
  if (g(fd, 'union') === '__other') loc.union_name = g(fd, 'union_other');
  const post_code = g(fd, 'post_code');
  if (post_code && !/^\d{4}$/.test(post_code)) redirect('/profile?edit=address&error=addr');
  await patchCitizen(u.id, { ...loc, holding: g(fd, 'holding'), village: g(fd, 'village'), ward: g(fd, 'ward'), post: g(fd, 'post'), post_code });
  redirect('/profile?saved=address');
}
async function savePhoto(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const f = fd.get('photo');
  if (await badPhoto(f)) redirect('/profile?edit=photo&error=photo');
  await patchCitizen(u.id, { photo: await uploadPhoto(u.id, f) });
  redirect('/profile?saved=photo');
}
async function saveEmail(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const email = g(fd, 'email').toLowerCase();
  if (!EMAIL.test(email)) redirect('/profile?edit=email&mail=bad');
  if (email === u.email) redirect('/profile');
  const other = await getByEmail(email);
  if (other && other.id !== u.id) redirect('/profile?edit=email&mail=dup');
  await patchCitizen(u.id, { email, email_verified: false });
  redirect('/profile?mail=' + (await sendOtp('email', email, { id: u.id })));
}
async function resend() {
  'use server';
  const u = await requireCitizen('/profile');
  redirect('/profile?mail=' + (u.email ? await sendOtp('email', u.email, { id: u.id }) : 'bad'));
}
async function verifyEmail(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  if (!u.email) redirect('/profile?mail=bad');
  const res = await checkOtp('email', u.email, fd.get('code'));
  if (res.error) redirect('/profile?error=' + res.error);
  if (res.payload?.id !== u.id) redirect('/profile?error=expired');
  await patchCitizen(u.id, { email_verified: true });
  redirect('/profile?verified=1');
}
async function changePassword(fd) {
  'use server';
  const u = await requireCitizen('/profile');
  const cur = String(fd.get('current') || ''), nw = String(fd.get('password') || ''), c2 = String(fd.get('confirm') || '');
  if (!verify(cur, u.pass_hash)) redirect('/profile?edit=password&error=cur');
  if (nw.length < 8) redirect('/profile?edit=password&error=short');
  if (nw !== c2) redirect('/profile?edit=password&error=match');
  const ph = hash(nw);
  await patchCitizen(u.id, { pass_hash: ph });
  startSession({ ...u, pass_hash: ph }); // পাসওয়ার্ড বদলালে পুরোনো সেশন অকেজো হয়, তাই এখনকার সেশন নতুন করে চালু
  redirect('/profile?saved=password');
}

const OK = { personal: 'ব্যক্তিগত তথ্য সংরক্ষণ হয়েছে।', address: 'ঠিকানা সংরক্ষণ হয়েছে।', photo: 'ছবি সংরক্ষণ হয়েছে।', password: 'পাসওয়ার্ড বদলানো হয়েছে।' };
const ERR = {
  wrong: 'কোডটি ঠিক নেই। আবার দেখে লিখুন।', expired: 'কোডের মেয়াদ শেষ বা কোড নেই। নতুন কোড নিন।', locked: 'অনেকবার ভুল হয়েছে। ১ মিনিট পরে নতুন কোড নিন।',
  bn: 'বাংলা ঘরগুলো বাংলা অক্ষরে লিখুন।', addr: 'পোস্ট কোড ৪ ডিজিটের সংখ্যা হতে হবে।',
  1: 'নাম দিন। NID/জন্ম নিবন্ধন নম্বর (নিজের, পিতার ও মাতার) ১০ থেকে ১৭ ডিজিটের সংখ্যা, জন্ম তারিখ আজকের আগের এবং মোবাইল নম্বর ১১ ডিজিটের (01XXXXXXXXX) হতে হবে।',
  photo: 'JPG বা PNG ছবি বেছে নিন, ১ MB-এর মধ্যে।', cur: 'বর্তমান পাসওয়ার্ড ঠিক নেই।', short: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', match: 'নতুন পাসওয়ার্ড দুটি মেলেনি।',
};
const MAIL = { sent: ['ok', 'ইমেইলে ৬ ডিজিটের কোড পাঠানো হয়েছে। কোডটি নিচে লিখুন।'], wait: ['warn', 'নতুন কোড পাঠাতে ১ মিনিট অপেক্ষা করুন। আগের কোডটিই চলবে।'], dup: ['bad', 'এই ইমেইল অন্য একটি অ্যাকাউন্টে আছে।'], bad: ['bad', 'সঠিক ইমেইল ঠিকানা দিন।'], fail: ['bad', 'ইমেইল পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।'], none: ['bad', 'কোড পাঠানো যায়নি। আগে ইমেইল যোগ করুন।'] };
const SEC = { name: 'personal', name_bn: 'personal', father: 'personal', father_bn: 'personal', mother: 'personal', mother_bn: 'personal', mobile: 'personal', dob: 'personal', nid: 'personal', division: 'address', district: 'address', upazila: 'address', union_name: 'address', village: 'address', ward: 'address', post: 'address', post_code: 'address', email: 'email', photo: 'photo' };

const Row = ({ l, v }) => <div className="kv"><span>{l}</span><b>{v || <em className="miss">যোগ করা হয়নি</em>}</b></div>;
const F = ({ l, n, v, type = 'text', ph, req }) => <div><label htmlFor={n}>{l}</label><input id={n} name={n} type={type} defaultValue={v || ''} placeholder={ph} required={req} /></div>;
const Sec = ({ id, icon, title, editing, children }) => (
  <section id={id} className="card pf-sec">
    <div className="sec-h">
      <h2><span className="ic sm"><Icon n={icon} size={18} /></span>{title}</h2>
      {editing ? <a className="btn out sm" href="/profile">বাতিল</a> : <a className="btn out sm" href={`/profile?edit=${id}#${id}`}><Icon n="edit" size={15} /> সম্পাদনা</a>}
    </div>
    {children}
  </section>
);
const Save = ({ t = 'সংরক্ষণ করুন' }) => <button className="btn" style={{ marginTop: 18 }}><Icon n="check" size={18} /> {t}</button>;
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
  const pc = percent(u), ed = searchParams.edit;
  const [ph] = u.photo ? await docUrls([u.photo]) : [];
  const mail = MAIL[searchParams.mail];
  const dob = u.dob && bn(u.dob.split('-').reverse().join('/'));
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>আমার প্রোফাইল</h1>
      <p className="sub">প্রতিটি অংশের পাশের "সম্পাদনা" বাটন চেপে সেই অংশটি বদলাতে পারবেন।</p>
      {searchParams.need && <p className="badge warn">সেবার আবেদন করতে আগে প্রোফাইল ১০০% সম্পূর্ণ করতে এবং ইমেইল যাচাই করতে হবে।</p>}
      {searchParams.welcome && <p className="badge ok">অ্যাকাউন্ট তৈরি হয়েছে। এবার প্রোফাইল সম্পূর্ণ করুন।</p>}
      {OK[searchParams.saved] && <p className="badge ok">{OK[searchParams.saved]}</p>}
      {searchParams.verified && <p className="badge ok">ইমেইল যাচাই সম্পন্ন হয়েছে।</p>}
      {mail && <p className={`badge ${mail[0]}`}>{mail[1]}</p>}
      {ERR[searchParams.error] && <p className="badge bad">{ERR[searchParams.error]}</p>}
      <div className="pf">
        <aside className="card pf-aside">
          {ph?.url ? <img className="pf-av" src={ph.url} alt="আপনার ছবি" /> : <div className="pf-ini" aria-hidden="true">{[...(u.name_bn || u.name || '?')][0]}</div>}
          <div style={{ fontWeight: 700, fontSize: 19 }}>{u.name_bn || u.name}</div>
          <div style={{ margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}><AccountBadge u={u} center={false} /></div>
          <div className="sub" style={{ margin: 0, wordBreak: 'break-all' }}>{u.email}</div>
          <div style={{ margin: '14px 0 6px' }}><Ring pc={pc} /></div>
          {pc === 100 && u.email_verified
            ? <><span className="badge ok">প্রোফাইল সম্পূর্ণ</span><br /><a className="btn" href="/#services">সেবার আবেদন করুন</a></>
            : <span className="badge warn">সম্পূর্ণ করতে বাকি আছে</span>}
          <ul className="chk">{FIELDS.map(([k, l]) => (
            <li key={k}><span className={u[k] ? 'on' : 'off'} aria-hidden="true">{u[k] ? '✓' : '○'}</span>
              <span>{!u[k] && SEC[k] ? <a href={`/profile?edit=${SEC[k]}#${SEC[k]}`}>{l}</a> : l}</span><span className="sr">{u[k] ? ' (পূরণ করা)' : ' (বাকি)'}</span></li>
          ))}</ul>
        </aside>
        <div>
          <Sec id="photo" icon="camera" title="প্রোফাইল ছবি" editing={ed === 'photo'}>
            {ed === 'photo' ? (
              <form action={savePhoto}><PhotoPick current={ph?.url} /><Save /></form>
            ) : (
              <div className="photo"><div className="ph">{ph?.url ? <img src={ph.url} alt="আপনার ছবি" /> : <span>ছবি নেই</span>}</div><p className="sub" style={{ margin: 0 }}>পাসপোর্ট সাইজ, মুখ পরিষ্কার দেখা যায় এমন ছবি। JPG বা PNG, ১ MB পর্যন্ত।</p></div>
            )}
          </Sec>
          <Sec id="personal" icon="user" title="ব্যক্তিগত তথ্য" editing={ed === 'personal'}>
            {ed === 'personal' ? (
              <form action={savePersonal}>
                <div className="row">
                  <F l="নাম (বাংলা)" n="name_bn" v={u.name_bn} ph="যেমন: মোঃ রাসেল আহমেদ" /><F l="নাম (ইংরেজি)" n="name" v={u.name} req />
                  <F l="পিতার নাম (বাংলা)" n="father_bn" v={u.father_bn} /><F l="পিতার নাম (ইংরেজি)" n="father" v={u.father} />
                  <F l="পিতার NID নম্বর (ঐচ্ছিক)" n="father_nid" v={u.father_nid} ph="১০–১৭ ডিজিট" />
                  <F l="মাতার নাম (বাংলা)" n="mother_bn" v={u.mother_bn} /><F l="মাতার নাম (ইংরেজি)" n="mother" v={u.mother} />
                  <F l="মাতার NID নম্বর (ঐচ্ছিক)" n="mother_nid" v={u.mother_nid} ph="১০–১৭ ডিজিট" />
                  <F l="জন্ম তারিখ" n="dob" type="date" v={u.dob} /><F l="NID / জন্ম নিবন্ধন নম্বর" n="nid" v={u.nid} ph="১০–১৭ ডিজিট" />
                  <F l="মোবাইল নম্বর" n="mobile" v={u.mobile} ph="01XXXXXXXXX" />
                </div>
                <Save />
              </form>
            ) : (
              <>
                <Row l="নাম (বাংলা)" v={u.name_bn} /><Row l="নাম (ইংরেজি)" v={u.name} />
                <Row l="পিতার নাম (বাংলা)" v={u.father_bn} /><Row l="পিতার নাম (ইংরেজি)" v={u.father} />
                <div className="kv"><span>পিতার NID নম্বর</span><b>{u.father_nid ? bn(u.father_nid) : <em className="miss">ঐচ্ছিক</em>}</b></div>
                <Row l="মাতার নাম (বাংলা)" v={u.mother_bn} /><Row l="মাতার নাম (ইংরেজি)" v={u.mother} />
                <div className="kv"><span>মাতার NID নম্বর</span><b>{u.mother_nid ? bn(u.mother_nid) : <em className="miss">ঐচ্ছিক</em>}</b></div>
                <Row l="জন্ম তারিখ" v={dob} /><Row l="NID / জন্ম নিবন্ধন নম্বর" v={u.nid && bn(u.nid)} /><Row l="মোবাইল নম্বর" v={u.mobile && bn(u.mobile)} />
              </>
            )}
          </Sec>
          <Sec id="address" icon="map" title="স্থায়ী ঠিকানা" editing={ed === 'address'}>
            {ed === 'address' ? (
              <form action={saveAddress}>
                <div className="row">
                  <AddressPicker init={toIds(u)} other={u.union_name} />
                  <F l="বাসা/হোল্ডিং নং (ঐচ্ছিক)" n="holding" v={u.holding} /><F l="গ্রাম / মহল্লা" n="village" v={u.village} />
                  <F l="ওয়ার্ড নং" n="ward" v={u.ward} /><F l="পোস্ট অফিস" n="post" v={u.post} /><F l="পোস্ট কোড" n="post_code" v={u.post_code} ph="৪ ডিজিট, যেমন 7040" />
                </div>
                <Save />
              </form>
            ) : (
              <>
                <Row l="বিভাগ" v={u.division} /><Row l="জেলা" v={u.district} /><Row l="উপজেলা" v={u.upazila} /><Row l="ইউনিয়ন" v={u.union_name} />
                <div className="kv"><span>বাসা/হোল্ডিং নং</span><b>{u.holding ? bn(u.holding) : <em className="miss">ঐচ্ছিক</em>}</b></div>
                <Row l="গ্রাম / মহল্লা" v={u.village} /><Row l="ওয়ার্ড নং" v={u.ward && bn(u.ward)} /><Row l="পোস্ট অফিস" v={u.post} /><Row l="পোস্ট কোড" v={u.post_code && bn(u.post_code)} />
              </>
            )}
          </Sec>
          <Sec id="email" icon="mail" title="ইমেইল" editing={ed === 'email'}>
            {ed === 'email' ? (
              <form action={saveEmail}>
                <div className="row"><F l="ইমেইল ঠিকানা" n="email" type="email" v={u.email} req /></div>
                <p className="sub" style={{ margin: '8px 0 0', fontSize: 14 }}>ইমেইল বদলালে নতুন ঠিকানায় ৬ ডিজিটের কোড যাবে।</p>
                <Save />
              </form>
            ) : (
              <>
                <div className="kv"><span>ইমেইল</span><b>{u.email || <em className="miss">যোগ করা হয়নি</em>} {u.email && <span className={`badge ${u.email_verified ? 'ok' : 'warn'}`}>{u.email_verified ? 'যাচাই হয়েছে' : 'যাচাই বাকি'}</span>}</b></div>
                {u.email && !u.email_verified && (
                  <div style={{ marginTop: 14 }}>
                    <p className="sub" style={{ margin: '0 0 6px' }}>{u.email} ঠিকানায় পাঠানো ৬ ডিজিটের কোড লিখুন।</p>
                    <form action={verifyEmail}>
                      <label htmlFor="code" style={{ marginTop: 0 }}>যাচাইয়ের কোড</label>
                      <input id="code" name="code" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
                      <button className="btn"><Icon n="check" size={18} /> যাচাই করুন</button>
                    </form>
                    <form action={resend}><button className="btn out" style={{ marginTop: 10 }}><Icon n="mail" size={17} /> কোড পাননি? আবার পাঠান</button></form>
                  </div>
                )}
              </>
            )}
          </Sec>
          <Sec id="password" icon="key" title="পাসওয়ার্ড" editing={ed === 'password'}>
            {ed === 'password' ? (
              <form action={changePassword}>
                <div className="row">
                  <div><label htmlFor="current">বর্তমান পাসওয়ার্ড</label><input id="current" name="current" type="password" autoComplete="current-password" required /></div>
                  <div><label htmlFor="password">নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
                  <div><label htmlFor="confirm">নতুন পাসওয়ার্ড আবার লিখুন</label><input id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required /></div>
                </div>
                <Save t="পাসওয়ার্ড বদলান" />
              </form>
            ) : (
              <div className="kv"><span>পাসওয়ার্ড</span><b>••••••••</b></div>
            )}
          </Sec>
        </div>
      </div>
    </div>
  );
}
