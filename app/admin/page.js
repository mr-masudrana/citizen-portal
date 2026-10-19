import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { all, get, decideApplication, docUrls, getSettings, saveSettings, writeAuditLog, recentAuditLogs, certificatesForApplications, revokeCertificate, reissueCertificate, reserveAdminLoginAttempt, clearAdminLoginAttempts, listServiceFees, saveServiceFee, allApplicationPayments, reviewApplicationPayment } from '../../lib/db';
import AdminApplications from './AdminApplications';
import { hash as hashPassword, verify as verifyPassword } from '../../lib/auth';
import { getStaffByUsername, getStaffById, listStaffUsers, createStaffUser, setStaffUserActive, updateStaffPassword, getCitizen, createCitizenNotification } from '../../lib/db';
import { sendTransactionalEmail } from '../../lib/email';

export const dynamic = 'force-dynamic';
const adminSecret = () => process.env.ADMIN_KEY || '';
const signAdmin = (value) => createHmac('sha256', adminSecret()).update(value).digest('hex');
const tok = () => {
  const issued = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');
  const payload = `${issued}.${nonce}`;
  return `${payload}.${signAdmin(payload)}`;
};
const authed = () => {
  const key = adminSecret();
  if (key.length < 32) return false;
  const got = cookies().get('admin')?.value || '';
  if (got.length > 200) return false;
  const parts = got.split('.');
  if (parts.length !== 3) return false;
  const [issued, nonce, sig] = parts;
  const time = Number(issued);
  if (!Number.isSafeInteger(time) || time > Date.now() + 60_000 || Date.now() - time > 8 * 60 * 60 * 1000 || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(sig)) return false;
  const expected = Buffer.from(signAdmin(`${issued}.${nonce}`), 'hex');
  const actual = Buffer.from(sig, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
const roleSignature = (payload) => createHmac('sha256', adminSecret()).update(`role:${payload}`).digest('hex');
const setRoleCookie = (role, staffId = 'root') => {
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `${role}.${staffId}.${exp}`;
  cookies().set('admin_role', `${payload}.${roleSignature(payload)}`, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 8 * 60 * 60 });
};
const currentRole = async () => {
  const raw = cookies().get('admin_role')?.value || '';
  const parts = raw.split('.');
  if (parts.length !== 4) return 'invalid'; // every session must carry a separately signed role cookie
  const [role, staffId, expRaw, sig] = parts; const exp = Number(expRaw);
  if (!['super_admin','admin','reviewer','viewer'].includes(role) || !staffId || !Number.isSafeInteger(exp) || exp <= Date.now() || exp > Date.now() + 8*60*60*1000 + 60_000 || !/^[a-f0-9]{64}$/.test(sig)) return 'invalid';
  const expected = Buffer.from(roleSignature(`${role}.${staffId}.${expRaw}`), 'hex'); const actual = Buffer.from(sig, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return 'invalid';
  if (role === 'super_admin') return staffId === 'root' ? role : 'invalid';
  // Re-check the account on every request so disabled accounts or changed roles lose access immediately.
  if (!/^[0-9a-f-]{36}$/i.test(staffId)) return 'invalid';
  try {
    const staff = await getStaffById(staffId);
    return staff && staff.active && staff.role === role ? role : 'invalid';
  } catch (error) {
    console.error('Could not validate current staff account; access denied:', error?.message || error);
    return 'invalid';
  }
};
const can = async (allowed) => authed() && allowed.includes(await currentRole());
function currentStaffId() {
  const raw = cookies().get('admin_role')?.value || '';
  const parts = raw.split('.');
  if (parts.length !== 4) return null;
  const [role, staffId, expRaw, sig] = parts;
  if (!['admin','reviewer','viewer'].includes(role) || !/^[0-9a-f-]{36}$/i.test(staffId) || !Number.isSafeInteger(Number(expRaw)) || Number(expRaw) <= Date.now()) return null;
  const payload = `${role}.${staffId}.${expRaw}`;
  const expected = Buffer.from(roleSignature(payload), 'hex'); const actual = Buffer.from(sig, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? staffId : null;
}
async function audit(input) {
  try { await writeAuditLog(input); }
  catch (error) { console.error('Admin audit log failed. Run supabase/phase3-admin.sql:', error?.message || error); }
}
async function login(fd) {
  'use server';
  const provided = String(fd.get('key') || '');
  const expected = adminSecret();
  const h = headers();
  const ip = h.get('x-real-ip') || 'unknown';
  const key = createHash('sha256').update(ip).digest('hex');
  let allowed = false;
  try { allowed = await reserveAdminLoginAttempt(key); }
  catch (error) { console.error('Shared admin rate limiter unavailable; login fails closed:', error?.message || error); return; }
  if (!allowed) return;
  const a = Buffer.from(provided), b = Buffer.from(expected);
  if (expected.length >= 32 && a.length === b.length && timingSafeEqual(a, b)) {
    try { await clearAdminLoginAttempts(key); } catch (error) { console.error('Could not clear admin login attempts:', error?.message || error); }
    cookies().set('admin', tok(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 8 * 60 * 60 });
    setRoleCookie('super_admin', 'root');
    await audit({ action: 'admin_login', entity_type: 'admin_session', details: { result: 'success' } });
  }
  revalidatePath('/admin');
}
async function staffLogin(fd) {
  'use server';
  const username = String(fd.get('username') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  if (!/^[a-z0-9._-]{3,40}$/.test(username) || password.length < 10 || password.length > 128) return;
  const h = headers();
  const ip = h.get('x-real-ip') || 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex');
  try { if (!(await reserveAdminLoginAttempt(ipHash))) return; }
  catch (error) { console.error('Shared staff rate limiter unavailable; login fails closed:', error?.message || error); return; }
  try {
    const staff = await getStaffByUsername(username);
    if (!staff || !staff.active || !verifyPassword(password, staff.password_hash)) return;
    try { await clearAdminLoginAttempts(ipHash); } catch (error) { console.error('Could not clear staff login attempts:', error?.message || error); }
    const issued = Date.now().toString(); const nonce = randomBytes(16).toString('hex'); const payload = `${issued}.${nonce}`;
    cookies().set('admin', `${payload}.${signAdmin(payload)}`, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 8 * 60 * 60 });
    setRoleCookie(staff.role, staff.id);
    await audit({ action: 'staff_login', entity_type: 'staff_user', entity_id: staff.id, details: { role: staff.role } });
  } catch (error) { console.error('Staff login unavailable; run phase6-staff-rbac.sql:', error?.message || error); }
  revalidatePath('/admin');
}
async function addStaff(fd) {
  'use server';
  if (!(await can(['super_admin']))) return;
  const username = String(fd.get('username') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  const role = String(fd.get('role') || '');
  if (!/^[a-z0-9._-]{3,40}$/.test(username) || password.length < 12 || password.length > 128 || !['admin','reviewer','viewer'].includes(role)) return;
  try {
    const staff = await createStaffUser({ username, password_hash: hashPassword(password), role });
    await audit({ action: 'staff_created', entity_type: 'staff_user', entity_id: staff.id, details: { username, role } });
  } catch (error) { console.error('Staff creation failed:', error?.message || error); return; }
  revalidatePath('/admin');
}
async function toggleStaff(fd) {
  'use server';
  if (!(await can(['super_admin']))) return;
  const id = String(fd.get('id') || ''); const active = String(fd.get('active') || '') === 'true';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  try { if (await setStaffUserActive(id, active)) await audit({ action: active ? 'staff_enabled' : 'staff_disabled', entity_type: 'staff_user', entity_id: id, details: {} }); } catch (error) { console.error('Staff update failed:', error?.message || error); }
  revalidatePath('/admin');
}
async function changeStaffPassword(fd) {
  'use server';
  if (!authed() || !['admin','reviewer','viewer'].includes(await currentRole())) return;
  const id = currentStaffId();
  const oldPassword = String(fd.get('old_password') || '');
  const newPassword = String(fd.get('new_password') || '');
  const confirm = String(fd.get('confirm_password') || '');
  if (!id || newPassword.length < 12 || newPassword.length > 128 || newPassword !== confirm || oldPassword.length > 128) return;
  try {
    const staff = await getStaffById(id);
    if (!staff || !staff.active || !verifyPassword(oldPassword, staff.password_hash)) return;
    const updated = await updateStaffPassword(id, hashPassword(newPassword));
    if (!updated) return;
    await audit({ action: 'staff_password_changed', entity_type: 'staff_user', entity_id: id, details: {} });
    // Invalidate this session after a credential change.
    cookies().set('admin', '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 0 });
    cookies().set('admin_role', '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 0 });
  } catch (error) { console.error('Staff password update failed:', error?.message || error); }
  revalidatePath('/admin');
}
async function logout() {
  'use server';
  cookies().set('admin', '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 0 });
  cookies().set('admin_role', '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 0 });
  revalidatePath('/admin');
}
async function decide(fd) {
  'use server';
  if (!(await can(['super_admin','admin','reviewer']))) return;
  const no = String(fd.get('no') || '').trim();
  const status = String(fd.get('s') || '');
  if (!/^S[0-9A-F]{8}$/.test(no) || !['approved', 'rejected'].includes(status)) return;
  const row = await get(no);
  if (!row || row.status !== 'pending') return;
  // Atomic conditional update prevents two admins/actions deciding the same pending application.
  const updated = await decideApplication(no, status, new Date().toISOString());
  if (!updated) return;
  await audit({ action: status === 'approved' ? 'application_approved' : 'application_rejected', entity_type: 'application', entity_id: no, details: { service: row.service } });
  try {
    const citizen = await getCitizen(row.citizen_id);
    const approved = status === 'approved';
    const title = approved ? 'আপনার আবেদন অনুমোদিত হয়েছে' : 'আপনার আবেদন বাতিল হয়েছে';
    const message = approved ? `আপনার ${row.service} আবেদন (${no}) অনুমোদিত হয়েছে। ড্যাশবোর্ডে সনদ দেখুন।` : `আপনার ${row.service} আবেদন (${no}) অনুমোদিত হয়নি। প্রয়োজনে অফিসে যোগাযোগ করুন।`;
    await createCitizenNotification({ citizen_id: row.citizen_id, application_no: no, title, message, kind: approved ? 'success' : 'warning' });
    if (citizen?.email) await sendTransactionalEmail({ to: citizen.email, subject: title, text: message });
  } catch (error) { console.error('Citizen notification failed; run supabase/phase7-notifications-password.sql:', error?.message || error); }
  revalidatePath('/admin');
  revalidatePath('/track');
  revalidatePath(`/certificate/${no}`);
}
async function updateServiceFee(fd) {
  'use server';
  if (!(await can(['super_admin','admin']))) return;
  const service = String(fd.get('service') || '').trim();
  const takaRaw = String(fd.get('fee_taka') || '').trim();
  const active = String(fd.get('active') || '') === 'true';
  if (!service || service.length > 120 || !/^\d{1,7}(?:\.\d{1,2})?$/.test(takaRaw)) return;
  const fee_paisa = Math.round(Number(takaRaw) * 100);
  if (!Number.isSafeInteger(fee_paisa) || fee_paisa < 0 || fee_paisa > 100000000 || (active && fee_paisa === 0)) return;
  try {
    const created = await saveServiceFee({ service, fee_paisa, active });
    await audit({ action: 'service_fee_updated', entity_type: 'service_fee', entity_id: service, details: { fee_paisa, active, payment_rows_created: created } });
  } catch (error) { console.error('Service fee update failed; run supabase/phase10-finance.sql:', error?.message || error); }
  revalidatePath('/admin'); revalidatePath('/dashboard');
}
async function decidePayment(fd) {
  'use server';
  if (!(await can(['super_admin','admin']))) return;
  const no = String(fd.get('application_no') || '').trim();
  const status = String(fd.get('status') || '');
  const note = String(fd.get('note') || '').trim().slice(0,500);
  if (!/^S[0-9A-F]{8}$/.test(no) || !['paid','rejected','waived'].includes(status) || (status === 'rejected' && note.length < 3)) return;
  try {
    const changed = await reviewApplicationPayment(no, status, await currentRole(), note);
    if (changed) await audit({ action: `payment_${status}`, entity_type: 'payment', entity_id: no, details: { status, note: note.slice(0,200) } });
  } catch (error) { console.error('Payment review failed; run supabase/phase10-finance.sql:', error?.message || error); }
  revalidatePath('/admin'); revalidatePath('/dashboard');
}
async function saveSet(fd) {
  'use server';
  if (!(await can(['super_admin','admin']))) return;
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 100);
  const settings = { union_name: g('union_name'), upazila: g('upazila'), district: g('district') };
  await saveSettings(settings);
  await audit({ action: 'settings_updated', entity_type: 'settings', details: settings });
  revalidatePath('/admin');
}
async function revokeCert(fd) {
  'use server';
  if (!(await can(['super_admin','admin']))) return;
  const no = String(fd.get('certificate_no') || '').trim();
  const reason = String(fd.get('reason') || '').trim().slice(0, 500);
  if (!/^CP-[A-Z0-9]{10}$/.test(no) || reason.length < 5) return;
  const changed = await revokeCertificate(no, reason);
  if (changed) await audit({ action: 'certificate_revoked', entity_type: 'certificate', entity_id: no, details: { reason } });
  revalidatePath('/admin'); revalidatePath('/verify');
}
async function reissueCert(fd) {
  'use server';
  if (!(await can(['super_admin','admin']))) return;
  const no = String(fd.get('certificate_no') || '').trim();
  if (!/^CP-[A-Z0-9]{10}$/.test(no)) return;
  const newNo = await reissueCertificate(no);
  if (newNo) await audit({ action: 'certificate_reissued', entity_type: 'certificate', entity_id: newNo, details: { replaced: no } });
  revalidatePath('/admin'); revalidatePath('/verify');
}
export default async function Admin() {
  if ((process.env.ADMIN_KEY || '').length < 32) return <div className="page"><p className="badge bad">.env ফাইলে ADMIN_KEY কমপক্ষে ৩২ অক্ষরের শক্তিশালী গোপন মান দিন।</p></div>;
  if (!authed()) return <div className="page" style={{ maxWidth: 560 }}><h1>কর্মকর্তা প্রবেশ</h1><p className="sub">অনুমোদিত কর্মকর্তা অ্যাকাউন্ট অথবা প্রাথমিক সুপার অ্যাডমিন কী ব্যবহার করুন।</p><form className="card" action={staffLogin}><h2 style={{fontSize:18,marginTop:0}}>কর্মকর্তা অ্যাকাউন্ট</h2><label htmlFor="username">ইউজারনেম</label><input id="username" name="username" autoComplete="username" required minLength={3} maxLength={40}/><label htmlFor="password">পাসওয়ার্ড</label><input id="password" name="password" type="password" autoComplete="current-password" required minLength={10} maxLength={128}/><button className="btn">লগইন</button></form><form className="card" action={login}><h2 style={{fontSize:18,marginTop:0}}>প্রাথমিক সুপার অ্যাডমিন</h2><label htmlFor="key">ADMIN_KEY</label><input id="key" name="key" type="password" autoComplete="current-password" required minLength={32}/><button className="btn out">প্রবেশ করুন</button></form></div>;
  const role = await currentRole();
  if (role === 'invalid') return <div className="page"><p className="badge bad">সেশন অবৈধ। আবার লগইন করুন।</p></div>;
  const mayReviewApplications = ['super_admin','admin','reviewer'].includes(role);
  const mayManage = ['super_admin','admin'].includes(role);
  const rows = mayReviewApplications ? await all() : [];
  const st = mayManage ? await getSettings() : {};
  let staffUsers = []; let staffTableMissing = false;
  if (role === 'super_admin') { try { staffUsers = await listStaffUsers(); } catch (error) { staffTableMissing = true; console.error('Run supabase/phase6-staff-rbac.sql:', error?.message || error); } }
  const urlEntries = mayReviewApplications ? await Promise.all(rows.map(async r => [r.no, await docUrls(r.files)])) : [];
  let logs = [];
  let auditMissing = false;
  if (mayManage) { try { logs = await recentAuditLogs(12); } catch (e) { auditMissing = true; console.error('Run supabase/phase3-admin.sql:', e?.message || e); } }
  const urlMap = Object.fromEntries(urlEntries);
  let certificates = [];
  let certificatesMissing = false;
  if (mayManage) { try { certificates = await certificatesForApplications(); } catch (e) { certificatesMissing = true; console.error('Run supabase/phase4-certificates.sql:', e?.message || e); } }
  let serviceFees = []; let paymentRows = []; let financeMissing = false;
  if (mayManage) {
    try { [serviceFees, paymentRows] = await Promise.all([listServiceFees(), allApplicationPayments()]); }
    catch (e) { financeMissing = true; console.error('Run supabase/phase10-finance.sql:', e?.message || e); }
  }
  return <div className="page" style={{ maxWidth: 1200 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><h1 style={{ marginBottom: 4 }}>অ্যাডমিন ড্যাশবোর্ড</h1><p className="sub" style={{ marginTop: 0 }}>আবেদন পর্যালোচনা, রিপোর্ট ও পোর্টাল সেটিংস · ভূমিকা: {{super_admin:'সুপার অ্যাডমিন',admin:'অ্যাডমিন',reviewer:'রিভিউয়ার',viewer:'শুধু দেখার অনুমতি'}[role] || role}</p></div><form action={logout}><button className="btn out" style={{ marginTop: 0 }}>লগআউট</button></form></div>
    {['admin','reviewer','viewer'].includes(role) && <section className="card" style={{marginBottom:20}}><h2 style={{marginTop:0,fontSize:20}}>নিজের পাসওয়ার্ড পরিবর্তন</h2><p className="sub">নতুন পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে। পরিবর্তনের পর নিরাপত্তার জন্য আপনাকে লগআউট করা হবে।</p><form className="row" action={changeStaffPassword}><div><label htmlFor="staff-old-password">বর্তমান পাসওয়ার্ড</label><input id="staff-old-password" name="old_password" type="password" autoComplete="current-password" required maxLength={128}/></div><div><label htmlFor="staff-new-password">নতুন পাসওয়ার্ড</label><input id="staff-new-password" name="new_password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></div><div><label htmlFor="staff-confirm-password">নতুন পাসওয়ার্ড নিশ্চিত করুন</label><input id="staff-confirm-password" name="confirm_password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></div><button className="btn">পাসওয়ার্ড পরিবর্তন</button></form></section>}
    {['super_admin','admin'].includes(role) && <form className="card" action={saveSet} style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>ইউনিয়ন পরিষদের তথ্য</h2><p className="sub" style={{ margin: '4px 0 0' }}>সনদের শিরোনাম ও যাচাই পেজে এই তথ্য ব্যবহার হবে।</p>
      <div className="row"><div><label htmlFor="s1">ইউনিয়ন পরিষদের নাম</label><input id="s1" name="union_name" defaultValue={st.union_name || ''} maxLength={100} placeholder="যেমন: ৬ নং ... ইউনিয়ন পরিষদ"/></div><div><label htmlFor="s2">উপজেলা</label><input id="s2" name="upazila" defaultValue={st.upazila || ''} maxLength={100}/></div><div><label htmlFor="s3">জেলা</label><input id="s3" name="district" defaultValue={st.district || ''} maxLength={100}/></div></div>
      <button className="btn">সেটিংস সংরক্ষণ করুন</button>
    </form>}
    {['super_admin','admin','reviewer'].includes(role) && <AdminApplications rows={rows} urls={urlMap} decideAction={decide}/>}
    {role === 'viewer' && <section className="card"><h2>শুধু দেখার অনুমতি</h2><p className="sub">এই ভূমিকার জন্য আবেদনকারীর নথি ও ব্যক্তিগত তথ্য দেখানো হয় না।</p></section>}
    {mayManage && <section className="card" style={{ marginTop: 24 }}><h2 style={{ marginTop: 0, fontSize: 20 }}>সেবা ফি ও আর্থিক ব্যবস্থাপনা</h2>
      <p className="sub">Phase 10 বর্তমানে অফলাইন পেমেন্ট রেফারেন্স যাচাই ও হিসাবের খাতা। কোনো পেমেন্ট গেটওয়ে সংযুক্ত নয়; ফি নির্ধারণের আগে প্রযোজ্য সরকারি/ইউনিয়ন অনুমোদিত ফি যাচাই করুন।</p>
      {financeMissing && <p className="badge bad">আর্থিক ব্যবস্থা চালু করতে Supabase SQL Editor-এ supabase/phase10-finance.sql চালান।</p>}
      {!financeMissing && <><h3 style={{fontSize:17}}>সেবা ফি নির্ধারণ</h3><p className="sub">ফি টাকা হিসেবে লিখুন। সক্রিয় ফি নতুন আবেদন এবং একই সেবার যেসব আবেদনে পেমেন্ট রেকর্ড নেই, সেগুলোর জন্য বকেয়া তৈরি করবে। ইতিমধ্যে তৈরি রেকর্ডের ফি বদলাবে না।</p>
      <div style={{display:'grid',gap:10}}>{serviceFees.map(f => <form key={f.service} action={updateServiceFee} className="row" style={{alignItems:'end',borderBottom:'1px solid var(--border,#ddd)',paddingBottom:10}}><div style={{flex:'2 1 220px'}}><label>সেবা</label><input name="service" value={f.service} readOnly/></div><div><label>ফি (৳)</label><input name="fee_taka" defaultValue={(f.fee_paisa/100).toFixed(2)} inputMode="decimal" required pattern="[0-9]{1,7}(\.[0-9]{1,2})?"/></div><div><label>অবস্থা</label><select name="active" defaultValue={String(f.active)}><option value="true">সক্রিয়</option><option value="false">বন্ধ</option></select></div><button className="btn" style={{margin:0}}>সংরক্ষণ</button></form>)}</div>
      <h3 style={{fontSize:17,marginTop:24}}>পেমেন্ট রেকর্ড</h3>{paymentRows.length === 0 ? <p className="sub">এখনো কোনো পেমেন্ট রেকর্ড নেই।</p> : <div className="tbl"><table style={{minWidth:850}}><thead><tr><th>আবেদন</th><th>সেবা</th><th>পরিমাণ</th><th>স্ট্যাটাস</th><th>রেফারেন্স</th><th>পর্যালোচনা</th></tr></thead><tbody>{paymentRows.map(p => <tr key={p.id}><td>{p.application_no}</td><td>{p.service}</td><td>৳{(p.amount_paisa/100).toLocaleString('bn-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>{{due:'বকেয়া',submitted:'যাচাইয়ের অপেক্ষায়',paid:'পরিশোধিত',rejected:'প্রত্যাখ্যাত',waived:'মওকুফ'}[p.status] || p.status}</td><td>{p.payer_reference || '—'}</td><td>{p.status === 'submitted' ? <div style={{display:'grid',gap:6,minWidth:180}}><form action={decidePayment}><input type="hidden" name="application_no" value={p.application_no}/><input type="hidden" name="status" value="paid"/><button className="btn" style={{margin:0}}>পরিশোধিত নিশ্চিত</button></form><form action={decidePayment} style={{display:'grid',gap:6}}><input type="hidden" name="application_no" value={p.application_no}/><input type="hidden" name="status" value="rejected"/><input name="note" required minLength={3} maxLength={500} placeholder="প্রত্যাখ্যানের কারণ"/><button className="btn red" style={{margin:0}}>প্রত্যাখ্যান</button></form></div> : p.status === 'due' ? <form action={decidePayment}><input type="hidden" name="application_no" value={p.application_no}/><input type="hidden" name="status" value="waived"/><input name="note" required minLength={3} maxLength={500} placeholder="মওকুফের কারণ"/><button className="btn out" style={{margin:0}}>ফি মওকুফ</button></form> : <span className="sub">সম্পন্ন</span>}</td></tr>)}</tbody></table></div>}</>}
    </section>}
    {mayManage && <section className="card" style={{ marginTop: 24 }}><h2 style={{ marginTop: 0, fontSize: 20 }}>ডিজিটাল সনদ ব্যবস্থাপনা</h2>
      {certificatesMissing && <p className="badge bad">সনদ ব্যবস্থাপনা চালু করতে Supabase SQL Editor-এ supabase/phase4-certificates.sql চালান।</p>}
      {!certificatesMissing && certificates.length === 0 && <p className="sub">এখনো কোনো সনদ ইস্যু হয়নি। অনুমোদিত আবেদনের জন্য সনদ তৈরি হবে।</p>}
      {certificates.length > 0 && <div className="tbl"><table style={{ minWidth: 760 }}><thead><tr><th>সনদ নম্বর</th><th>আবেদন</th><th>অবস্থা</th><th>ইস্যুর তারিখ</th><th>কাজ</th></tr></thead><tbody>{certificates.map(c => <tr key={c.certificate_no}><td><a href={`/verify?no=${encodeURIComponent(c.certificate_no)}`} target="_blank" rel="noreferrer">{c.certificate_no}</a></td><td>{c.application_no}</td><td>{{active:'বৈধ',revoked:'বাতিল',reissued:'পুনঃইস্যু হয়েছে'}[c.status] || c.status}</td><td>{new Date(c.issued_at).toLocaleDateString('bn-BD')}</td><td>{c.status === 'active' && ['super_admin','admin'].includes(role) ? <div style={{display:'grid',gap:8}}><form action={reissueCert}><input type="hidden" name="certificate_no" value={c.certificate_no}/><button className="btn out" style={{margin:0}}>পুনঃইস্যু</button></form><form action={revokeCert} style={{display:'grid',gap:6}}><input type="hidden" name="certificate_no" value={c.certificate_no}/><input name="reason" aria-label="বাতিলের কারণ" placeholder="বাতিলের কারণ (কমপক্ষে ৫ অক্ষর)" minLength={5} maxLength={500} required/><button className="btn red" style={{margin:0}}>সনদ বাতিল</button></form></div> : <span className="sub">কোনো কাজ নেই</span>}</td></tr>)}</tbody></table></div>}
    </section>}
    {role === 'super_admin' && <section className="card" style={{ marginTop: 24 }}><h2 style={{ marginTop: 0, fontSize: 20 }}>কর্মকর্তা অ্যাকাউন্ট ও অনুমতি</h2>
      <p className="sub">সুপার অ্যাডমিন এখানে আলাদা কর্মকর্তা অ্যাকাউন্ট তৈরি/বন্ধ করতে পারবেন। পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।</p>
      {staffTableMissing && <p className="badge bad">কর্মকর্তা ব্যবস্থাপনার জন্য supabase/phase6-staff-rbac.sql migration চালান।</p>}
      <form className="row" action={addStaff} style={{alignItems:'end'}}><div><label htmlFor="new-staff-user">ইউজারনেম</label><input id="new-staff-user" name="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+"/></div><div><label htmlFor="new-staff-pass">অস্থায়ী পাসওয়ার্ড</label><input id="new-staff-pass" name="password" type="password" required minLength={12} maxLength={128}/></div><div><label htmlFor="new-staff-role">ভূমিকা</label><select id="new-staff-role" name="role" required><option value="reviewer">রিভিউয়ার</option><option value="admin">অ্যাডমিন</option><option value="viewer">শুধু দেখার অনুমতি</option></select></div><button className="btn">অ্যাকাউন্ট তৈরি</button></form>
      {!staffTableMissing && <div className="tbl"><table style={{minWidth:560}}><thead><tr><th>ইউজারনেম</th><th>ভূমিকা</th><th>অবস্থা</th><th>কাজ</th></tr></thead><tbody>{staffUsers.map(u => <tr key={u.id}><td>{u.username}</td><td>{{admin:'অ্যাডমিন',reviewer:'রিভিউয়ার',viewer:'শুধু দেখার অনুমতি'}[u.role] || u.role}</td><td>{u.active ? 'সক্রিয়' : 'বন্ধ'}</td><td><form action={toggleStaff}><input type="hidden" name="id" value={u.id}/><input type="hidden" name="active" value={u.active ? 'false' : 'true'}/><button className="btn out" style={{margin:0}}>{u.active ? 'বন্ধ করুন' : 'চালু করুন'}</button></form></td></tr>)}</tbody></table></div>}
    </section>}
    {mayManage && <section className="card" style={{ marginTop: 24 }}><h2 style={{ marginTop: 0, fontSize: 20 }}>সাম্প্রতিক প্রশাসনিক কার্যক্রম</h2>
      {auditMissing && <p className="badge bad">Audit Log চালু করতে Supabase SQL Editor-এ supabase/phase3-admin.sql চালান।</p>}
      {!auditMissing && logs.length === 0 && <p className="sub">এখনো কোনো কার্যক্রম রেকর্ড হয়নি।</p>}
      {logs.length > 0 && <div className="tbl"><table style={{ minWidth: 560 }}><thead><tr><th>সময়</th><th>কার্যক্রম</th><th>ধরন</th><th>রেফারেন্স</th></tr></thead><tbody>{logs.map(log => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString('bn-BD')}</td><td>{({admin_login:'অ্যাডমিন লগইন',application_approved:'আবেদন অনুমোদন',application_rejected:'আবেদন বাতিল',settings_updated:'সেটিংস পরিবর্তন',certificate_revoked:'সনদ বাতিল',certificate_reissued:'সনদ পুনঃইস্যু'})[log.action] || log.action}</td><td>{log.entity_type}</td><td>{log.entity_id || '—'}</td></tr>)}</tbody></table></div>}
    </section>}
  </div>;
}
