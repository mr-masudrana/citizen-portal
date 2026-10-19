import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createHash } from 'crypto';
import { all, patch, docUrls, getSettings, saveSettings } from '../../lib/db';
import { EXTRA } from '../../lib/services';
const lab = (s, k) => (EXTRA[s] || []).find((e) => e[0] === k)?.[1] || k;
export const dynamic = 'force-dynamic';
const tok = () => createHash('sha256').update('adm:' + (process.env.ADMIN_KEY || '')).digest('hex');
const authed = () => !!process.env.ADMIN_KEY && cookies().get('admin')?.value === tok();
async function login(fd) {
  'use server';
  if (process.env.ADMIN_KEY && String(fd.get('key')) === process.env.ADMIN_KEY)
    cookies().set('admin', tok(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin' });
  revalidatePath('/admin');
}
async function decide(fd) {
  'use server';
  if (!authed()) return;
  await patch(String(fd.get('no')), { status: fd.get('s') === 'approved' ? 'approved' : 'rejected', decidedAt: new Date().toISOString() });
  revalidatePath('/admin');
}
async function saveSet(fd) {
  'use server';
  if (!authed()) return;
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 100);
  await saveSettings({ union_name: g('union_name'), upazila: g('upazila'), district: g('district') });
  revalidatePath('/admin');
}
export default async function Admin() {
  if (!process.env.ADMIN_KEY) return <div className="page"><p className="badge bad">.env ফাইলে ADMIN_KEY সেট করুন।</p></div>;
  if (!authed()) return (
    <div className="page"><h1>কর্মকর্তা প্রবেশ</h1>
      <form className="card" action={login}><label htmlFor="key">অ্যাডমিন কী</label><input id="key" name="key" type="password" required /><button className="btn">প্রবেশ করুন</button></form></div>
  );
  const rows = await all();
  const st = await getSettings();
  const urls = await Promise.all(rows.map((r) => docUrls(r.files)));
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>আবেদন অনুমোদন</h1>
      <form className="card" action={saveSet} style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>ইউনিয়ন পরিষদের তথ্য</h2>
        <p className="sub" style={{ margin: '4px 0 0' }}>সনদের শিরোনামে ও যাচাই পেজে এই তথ্য ছাপা হবে।</p>
        <div className="row">
          <div><label htmlFor="s1">ইউনিয়ন পরিষদের নাম</label><input id="s1" name="union_name" defaultValue={st.union_name || ''} placeholder="যেমন: ৬ নং ... ইউনিয়ন পরিষদ" /></div>
          <div><label htmlFor="s2">উপজেলা</label><input id="s2" name="upazila" defaultValue={st.upazila || ''} /></div>
          <div><label htmlFor="s3">জেলা</label><input id="s3" name="district" defaultValue={st.district || ''} /></div>
        </div>
        <button className="btn">সংরক্ষণ করুন</button>
      </form>
      <div className="tbl"><table>
        <thead><tr><th>নম্বর</th><th>সনদ</th><th>আবেদনকারী</th><th>মোবাইল</th><th>নথি ও বিবরণ</th><th>অবস্থা</th><th>কাজ</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.no}><td>{r.no}</td><td>{r.service}</td><td>{r.name}{r.father ? <><br /><small>পিতা: {r.father}</small></> : null}{r.union_name ? <><br /><small>ইউনিয়ন: {r.union_name}</small></> : null}</td><td>{r.mobile}</td>
            <td>
              {urls[i].map((u, j) => <div key={u.p}><a href={u.url} target="_blank" rel="noreferrer">নথি {j + 1}</a></div>)}
              {r.extra && !r.extra.heirs && (
                <details><summary>অতিরিক্ত তথ্য</summary>
                  {Object.entries(r.extra).filter(([k]) => k !== 'members').map(([k, v]) => <div key={k}>{lab(r.service, k)}: {String(v)}</div>)}
                  {r.extra.members && <ol>{r.extra.members.map((h, n) => <li key={n}>{h.name} ({h.rel}) {h.nid}</li>)}</ol>}</details>
              )}
              {r.extra?.heirs && (
                <details><summary>ওয়ারিশ ({r.extra.heirs.length})</summary>
                  <div>মৃত: {r.extra.dname}, পিতা: {r.extra.dfather || '—'}</div>
                  <ol>{r.extra.heirs.map((h, n) => <li key={n}>{h.name} ({h.rel}) {h.nid}</li>)}</ol></details>
              )}
            </td>
            <td>{r.status === 'pending' ? 'অপেক্ষমাণ' : r.status === 'approved' ? 'অনুমোদিত' : 'বাতিল'}</td>
            <td>{r.status === 'pending' && (
              <form action={decide} style={{ display: 'flex', gap: 8 }}><input type="hidden" name="no" value={r.no} />
                <button className="btn" style={{ margin: 0 }} name="s" value="approved">অনুমোদন</button>
                <button className="btn red" style={{ margin: 0 }} name="s" value="rejected">বাতিল</button></form>)}</td></tr>
        ))}</tbody></table></div>
      {rows.length === 0 && <p className="sub">এখনো কোনো আবেদন নেই।</p>}
    </div>
  );
}
