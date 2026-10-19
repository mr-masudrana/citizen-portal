import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
// শুধু সার্ভারে চলে। SUPABASE_SERVICE_KEY কখনো NEXT_PUBLIC_ দিয়ে শুরু করবেন না।
let _sb;
function db() {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL এবং SUPABASE_SERVICE_KEY environment variables সেট করুন।');
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}
const fromRow = (r) => r && { ...r, createdAt: r.created_at, decidedAt: r.decided_at };
const toRow = ({ createdAt, decidedAt, ...r }) => ({ ...r, ...(createdAt && { created_at: createdAt }), ...(decidedAt && { decided_at: decidedAt }) });
const chk = ({ error }) => { if (error) throw new Error(error.message); };
export async function all() { const res = await db().from('applications').select('*').order('created_at', { ascending: false }); chk(res); return res.data.map(fromRow); }
export async function get(no) { const res = await db().from('applications').select('*').eq('no', no).maybeSingle(); chk(res); return fromRow(res.data); }
export async function add(r) { chk(await db().from('applications').insert(toRow(r))); }
export async function patch(no, p) { chk(await db().from('applications').update(toRow(p)).eq('no', no)); }
const OK = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
export const badFile = (files) => !Array.isArray(files) || files.length > 3 || files.some((f) => !f || typeof f.size !== 'number' || !OK[f.type] || f.size <= 0 || f.size > 1048576);
export async function uploadDocs(no, files) {
  const paths = [];
  try {
    for (const [i, f] of files.entries()) {
      const p = `${no}/${i + 1}.${OK[f.type]}`;
      chk(await db().storage.from('documents').upload(p, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: false }));
      paths.push(p);
    }
    return paths;
  } catch (error) {
    if (paths.length) {
      try { await db().storage.from('documents').remove(paths); } catch { /* original error is more useful */ }
    }
    throw error;
  }
}
export const docUrls = (paths) => Promise.all((paths || []).map(async (p) => {
  const res = await db().storage.from('documents').createSignedUrl(p, 600);
  if (res.error) return { p, url: null };
  return { p, url: res.data?.signedUrl || null };
}));
export async function deleteDocs(paths) {
  const clean = (paths || []).filter((p) => typeof p === 'string' && p.length <= 300 && !p.startsWith('/') && !p.includes('..'));
  if (clean.length) {
    const { error } = await db().storage.from('documents').remove(clean);
    if (error) throw new Error(`নথি পরিষ্কারে সমস্যা: ${error.message}`);
  }
}

export async function getCitizen(id) { const res = await db().from('citizens').select('*').eq('id', id).maybeSingle(); chk(res); return res.data; }
export async function getByMobile(m) { const res = await db().from('citizens').select('*').eq('mobile', m).maybeSingle(); chk(res); return res.data; }
export async function addCitizen(r) { const res = await db().from('citizens').insert(r).select().single(); chk(res); return res.data; }
export async function patchCitizen(id, p) { chk(await db().from('citizens').update(p).eq('id', id)); }
export async function byCitizen(id) { const res = await db().from('applications').select('*').eq('citizen_id', id).order('created_at', { ascending: false }); chk(res); return res.data.map(fromRow); }
export async function uploadPhoto(id, f) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id)) || !f || !['image/jpeg', 'image/png'].includes(f.type) || f.size <= 0 || f.size > 1048576) throw new Error('অবৈধ ছবি। JPG/PNG এবং ১ MB-এর মধ্যে হতে হবে।');
  const p = `profile/${id}.${f.type === 'image/png' ? 'png' : 'jpg'}`;
  chk(await db().storage.from('documents').upload(p, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: true }));
  return p;
}

export async function getSettings() { try { const res = await db().from('settings').select('*').eq('id', 1).maybeSingle(); return res.data || {}; } catch { return {}; } }
export async function saveSettings(p) { chk(await db().from('settings').upsert({ id: 1, ...p })); }

export async function getByAuthUserId(authUserId) {
  const res = await db().from('citizens').select('*').eq('auth_user_id', authUserId).maybeSingle();
  chk(res); return res.data;
}
export async function addEmailCitizen({ auth_user_id, email, name, mobile }) {
  const res = await db().from('citizens').insert({ auth_user_id, email, email_verified: true, name, mobile, pass_hash: null }).select().single();
  chk(res); return res.data;
}

export async function decideApplication(no, status, decidedAt) {
  const certificateNo = status === 'approved' ? `CP-${randomBytes(5).toString('hex').toUpperCase()}` : `CP-${randomBytes(5).toString('hex').toUpperCase()}`;
  const res = await db().rpc('admin_decide_application', { p_no: no, p_status: status, p_decided_at: decidedAt, p_certificate_no: certificateNo });
  chk(res);
  return res.data ? { no, certificate_no: status === 'approved' ? certificateNo : null } : null;
}
export async function certificatesForApplications() {
  const res = await db().from('certificates').select('certificate_no, application_no, status, issued_at, revoked_at, revocation_reason, replaced_by').order('created_at', { ascending: false }).limit(500);
  chk(res); return res.data || [];
}
export async function getCertificate(certificateNo) {
  const res = await db().from('certificates').select('certificate_no, application_no, status, issued_at, revoked_at, revocation_reason, replaced_by').eq('certificate_no', certificateNo).maybeSingle();
  chk(res); return res.data;
}
export async function getCertificateWithApplication(certificateNo) {
  const c = await getCertificate(certificateNo);
  if (!c) return null;
  const application = await get(c.application_no);
  return application ? { ...c, application } : null;
}
export async function getActiveCertificateForApplication(applicationNo) {
  const res = await db().from('certificates').select('certificate_no, application_no, status, issued_at').eq('application_no', applicationNo).eq('status', 'active').maybeSingle();
  chk(res); return res.data;
}
export async function revokeCertificate(certificateNo, reason) {
  const res = await db().rpc('admin_revoke_certificate', { p_certificate_no: certificateNo, p_reason: reason });
  chk(res); return !!res.data;
}
export async function reissueCertificate(oldNo) {
  const newNo = `CP-${randomBytes(5).toString('hex').toUpperCase()}`;
  const res = await db().rpc('admin_reissue_certificate', { p_old_no: oldNo, p_new_no: newNo });
  chk(res); return res.data ? newNo : null;
}
export async function writeAuditLog({ action, entity_type = 'application', entity_id = null, details = {} }) {
  const res = await db().from('admin_audit_logs').insert({ action, entity_type, entity_id, details });
  chk(res);
}
export async function recentAuditLogs(limit = 25) {
  const res = await db().from('admin_audit_logs').select('id, action, entity_type, entity_id, details, created_at').order('created_at', { ascending: false }).limit(Math.min(Math.max(Number(limit) || 25, 1), 100));
  chk(res); return res.data || [];
}

// Shared database-backed admin login throttling. Requires supabase/phase5-production.sql.
export async function reserveAdminLoginAttempt(ipHash) {
  if (!/^[a-f0-9]{64}$/.test(String(ipHash))) return false;
  const res = await db().rpc('reserve_admin_login_attempt', { p_ip_hash: ipHash });
  chk(res);
  return res.data === true;
}
export async function clearAdminLoginAttempts(ipHash) {
  if (!/^[a-f0-9]{64}$/.test(String(ipHash))) return;
  const res = await db().rpc('clear_admin_login_attempts', { p_ip_hash: ipHash });
  chk(res);
}


// Named staff accounts (requires supabase/phase6-staff-rbac.sql). Passwords are scrypt hashes.
export async function getStaffByUsername(username) {
  const res = await db().from('staff_users').select('id, username, password_hash, role, active').eq('username', username).maybeSingle();
  chk(res); return res.data;
}
export async function listStaffUsers() {
  const res = await db().from('staff_users').select('id, username, role, active, created_at').order('created_at', { ascending: false }).limit(200);
  chk(res); return res.data || [];
}
export async function createStaffUser({ username, password_hash, role }) {
  const res = await db().from('staff_users').insert({ username, password_hash, role, active: true }).select('id, username, role, active, created_at').single();
  chk(res); return res.data;
}
export async function setStaffUserActive(id, active) {
  const res = await db().from('staff_users').update({ active }).eq('id', id).select('id').maybeSingle();
  chk(res); return !!res.data;
}


// Phase 7: staff self-service password changes and citizen notifications.
export async function getStaffById(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return null;
  const res = await db().from('staff_users').select('id, username, password_hash, role, active').eq('id', id).maybeSingle();
  chk(res); return res.data;
}
export async function updateStaffPassword(id, password_hash) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id)) || typeof password_hash !== 'string') return false;
  const res = await db().from('staff_users').update({ password_hash, updated_at: new Date().toISOString() }).eq('id', id).eq('active', true).select('id').maybeSingle();
  chk(res); return !!res.data;
}
export async function createCitizenNotification({ citizen_id, application_no, title, message, kind = 'info' }) {
  const res = await db().from('citizen_notifications').insert({ citizen_id, application_no, title, message, kind }).select('id').single();
  chk(res); return res.data;
}
export async function notificationsForCitizen(citizenId, limit = 20) {
  const res = await db().from('citizen_notifications').select('id, application_no, title, message, kind, read_at, created_at').eq('citizen_id', citizenId).order('created_at', { ascending: false }).limit(Math.min(Math.max(Number(limit) || 20, 1), 50));
  chk(res); return res.data || [];
}
export async function markCitizenNotificationsRead(citizenId) {
  const res = await db().from('citizen_notifications').update({ read_at: new Date().toISOString() }).eq('citizen_id', citizenId).is('read_at', null);
  chk(res);
}

// Phase 8 readiness probe: reports only success/failure, never database contents.
export async function checkDatabaseConnection() {
  const res = await db().from('settings').select('id').limit(1);
  chk(res);
  return true;
}

// Phase 10: server-side finance ledger. Never treat a citizen-submitted reference as a successful payment.
export async function listServiceFees() {
  const res = await db().from('service_fees').select('service, fee_paisa, active, updated_at').order('service');
  chk(res); return res.data || [];
}
export async function saveServiceFee({ service, fee_paisa, active }) {
  if (typeof service !== 'string' || !service.trim() || service.length > 120 || !Number.isSafeInteger(fee_paisa) || fee_paisa < 0 || fee_paisa > 100000000 || typeof active !== 'boolean') throw new Error('অবৈধ ফি সেটিংস।');
  chk(await db().from('service_fees').upsert({ service: service.trim(), fee_paisa, active, updated_at: new Date().toISOString() }));
  const synced = await db().rpc('sync_service_fee_payments', { p_service: service.trim() });
  chk(synced);
  return synced.data || 0;
}
export async function paymentsForCitizen(citizenId) {
  const res = await db().from('application_payments').select('id, application_no, service, amount_paisa, currency, status, method, payer_reference, admin_note, submitted_at, reviewed_at, created_at').eq('citizen_id', citizenId).order('created_at', { ascending: false }).limit(100);
  chk(res); return res.data || [];
}
export async function allApplicationPayments() {
  const res = await db().from('application_payments').select('id, application_no, citizen_id, service, amount_paisa, currency, status, method, payer_reference, admin_note, submitted_at, reviewed_at, reviewed_by, created_at').order('created_at', { ascending: false }).limit(500);
  chk(res); return res.data || [];
}
export async function submitCitizenPaymentReference(applicationNo, citizenId, reference) {
  if (!/^S[0-9A-F]{8}$/.test(String(applicationNo)) || !/^[0-9a-f-]{36}$/i.test(String(citizenId)) || typeof reference !== 'string' || reference.trim().length < 3 || reference.trim().length > 120) return false;
  const res = await db().rpc('citizen_submit_payment_reference', { p_application_no: applicationNo, p_citizen_id: citizenId, p_reference: reference.trim() });
  chk(res); return res.data === true;
}
export async function reviewApplicationPayment(applicationNo, status, reviewedBy, note = '') {
  if (!/^S[0-9A-F]{8}$/.test(String(applicationNo)) || !['paid','rejected','waived'].includes(status)) return false;
  const res = await db().rpc('admin_review_application_payment', { p_application_no: applicationNo, p_status: status, p_reviewed_by: String(reviewedBy || 'admin').slice(0,100), p_note: String(note || '').slice(0,500) });
  chk(res); return res.data === true;
}

// Phase 11: citizen complaints and public notices. Service-role access only; RLS stays enabled without client policies.
export async function createComplaint({ citizen_id, subject, category, message }) {
  if (!/^[0-9a-f-]{36}$/i.test(String(citizen_id)) || typeof subject !== 'string' || subject.trim().length < 5 || subject.length > 160 || typeof message !== 'string' || message.trim().length < 10 || message.length > 5000 || !['service','application','staff','technical','other'].includes(category)) throw new Error('অভিযোগের তথ্য সঠিক নয়।');
  const res = await db().from('citizen_complaints').insert({ citizen_id, subject: subject.trim(), category, message: message.trim(), status: 'submitted' }).select('id, ticket_no, subject, category, status, created_at').single();
  chk(res); return res.data;
}
export async function complaintsForCitizen(citizenId) {
  const res = await db().from('citizen_complaints').select('id, ticket_no, subject, category, message, status, staff_reply, created_at, updated_at').eq('citizen_id', citizenId).order('created_at', { ascending: false }).limit(100);
  chk(res); return res.data || [];
}
export async function listComplaints() {
  const res = await db().from('citizen_complaints').select('id, ticket_no, citizen_id, subject, category, message, status, staff_reply, created_at, updated_at').order('created_at', { ascending: false }).limit(500);
  chk(res); return res.data || [];
}
export async function updateComplaint({ id, status, staff_reply }) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id)) || !['in_review','resolved','rejected'].includes(status) || typeof staff_reply !== 'string' || staff_reply.length > 3000) throw new Error('অভিযোগ আপডেটের তথ্য সঠিক নয়।');
  const res = await db().from('citizen_complaints').update({ status, staff_reply: staff_reply.trim(), updated_at: new Date().toISOString() }).eq('id', id).select('id, ticket_no, citizen_id, status').maybeSingle();
  chk(res); return res.data;
}
export async function publishedNotices(limit = 50) {
  const res = await db().from('public_notices').select('id, title, body, category, published_at, expires_at').eq('status', 'published').order('published_at', { ascending: false }).limit(Math.min(Math.max(Number(limit) || 50, 1), 100));
  chk(res); return (res.data || []).filter(n => !n.expires_at || new Date(n.expires_at).getTime() > Date.now());
}
export async function listNotices() {
  const res = await db().from('public_notices').select('id, title, body, category, status, published_at, expires_at, created_at').order('created_at', { ascending: false }).limit(200);
  chk(res); return res.data || [];
}
export async function saveNotice({ id, title, body, category, status, expires_at }) {
  if (typeof title !== 'string' || title.trim().length < 5 || title.length > 180 || typeof body !== 'string' || body.trim().length < 10 || body.length > 10000 || !['general','service','urgent','meeting'].includes(category) || !['draft','published','archived'].includes(status)) throw new Error('নোটিশের তথ্য সঠিক নয়।');
  const row = { title: title.trim(), body: body.trim(), category, status, published_at: status === 'published' ? new Date().toISOString() : null, expires_at: expires_at || null, updated_at: new Date().toISOString() };
  if (id && /^[0-9a-f-]{36}$/i.test(String(id))) {
    const res = await db().from('public_notices').update(row).eq('id', id).select('id').maybeSingle(); chk(res); return res.data?.id || null;
  }
  const res = await db().from('public_notices').insert(row).select('id').single(); chk(res); return res.data.id;
}
