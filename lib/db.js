import { createClient } from '@supabase/supabase-js';
// শুধু সার্ভারে চলে। SUPABASE_SERVICE_KEY কখনো NEXT_PUBLIC_ দিয়ে শুরু করবেন না।
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const fromRow = (r) => r && { ...r, createdAt: r.created_at, decidedAt: r.decided_at };
const toRow = ({ createdAt, decidedAt, ...r }) => ({ ...r, ...(createdAt && { created_at: createdAt }), ...(decidedAt && { decided_at: decidedAt }) });
const chk = ({ error }) => { if (error) throw new Error(error.message); };
export async function all() { const res = await sb.from('applications').select('*').order('created_at', { ascending: false }); chk(res); return res.data.map(fromRow); }
export async function get(no) { const res = await sb.from('applications').select('*').eq('no', no).maybeSingle(); chk(res); return fromRow(res.data); }
export async function add(r) { chk(await sb.from('applications').insert(toRow(r))); }
export async function patch(no, p) { chk(await sb.from('applications').update(toRow(p)).eq('no', no)); }
const OK = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
export const badFile = (files) => files.length > 3 || files.some((f) => !OK[f.type] || f.size > 1048576);
export async function uploadDocs(no, files) {
  const paths = [];
  for (const [i, f] of files.entries()) {
    const p = `${no}/${i + 1}.${OK[f.type]}`;
    chk(await sb.storage.from('documents').upload(p, Buffer.from(await f.arrayBuffer()), { contentType: f.type }));
    paths.push(p);
  }
  return paths;
}
export const docUrls = (paths) => Promise.all((paths || []).map(async (p) => ({ p, url: (await sb.storage.from('documents').createSignedUrl(p, 600)).data?.signedUrl })));

export async function getCitizen(id) { const res = await sb.from('citizens').select('*').eq('id', id).maybeSingle(); chk(res); return res.data; }
export async function getByMobile(m) { const res = await sb.from('citizens').select('*').eq('mobile', m).maybeSingle(); chk(res); return res.data; }
export async function addCitizen(r) { const res = await sb.from('citizens').insert(r).select().single(); chk(res); return res.data; }
export async function patchCitizen(id, p) { chk(await sb.from('citizens').update(p).eq('id', id)); }
export async function byCitizen(id) { const res = await sb.from('applications').select('*').eq('citizen_id', id).order('created_at', { ascending: false }); chk(res); return res.data.map(fromRow); }
export async function uploadPhoto(id, f) {
  const p = `profile/${id}.${f.type === 'image/png' ? 'png' : 'jpg'}`;
  chk(await sb.storage.from('documents').upload(p, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: true }));
  return p;
}

export async function getSettings() { try { const res = await sb.from('settings').select('*').eq('id', 1).maybeSingle(); return res.data || {}; } catch { return {}; } }
export async function saveSettings(p) { chk(await sb.from('settings').upsert({ id: 1, ...p })); }
export async function getByEmail(e) { const res = await sb.from('citizens').select('*').eq('email', e).maybeSingle(); chk(res); return res.data; }

export async function getPending(email) { const res = await sb.from('pending_signups').select('*').eq('email', email).maybeSingle(); chk(res); return res.data; }
export async function getPendingByToken(h) { const res = await sb.from('pending_signups').select('*').eq('token_hash', h).maybeSingle(); chk(res); return res.data; }
export async function savePending(r) { chk(await sb.from('pending_signups').upsert(r)); }
export async function delPending(email) { chk(await sb.from('pending_signups').delete().eq('email', email)); }

export async function getOtp(key) { const res = await sb.from('otps').select('*').eq('key', key).maybeSingle(); chk(res); return res.data; }
export async function saveOtp(r) { chk(await sb.from('otps').upsert(r)); }
export async function patchOtp(key, p) { chk(await sb.from('otps').update(p).eq('key', key)); }
export async function delOtp(key) { chk(await sb.from('otps').delete().eq('key', key)); }

// ===== অ্যাডমিন প্যানেলের কোয়েরি =====
const clean = (q) => String(q || '').replace(/[^\p{L}\p{N}\s@._\-]/gu, '').trim().slice(0, 60);
export async function listApps({ status, service, q, filer, page = 1, size = 20, asc = false }) {
  let qb = sb.from('applications').select('*', { count: 'exact' }).order('created_at', { ascending: asc });
  if (status) qb = qb.eq('status', status);
  if (service) qb = qb.eq('service', service);
  if (filer) qb = qb.eq('filed_by', filer);
  const s = clean(q);
  if (s) qb = qb.or(`no.ilike.%${s}%,name.ilike.%${s}%,name_bn.ilike.%${s}%,nid.ilike.%${s}%,mobile.ilike.%${s}%`);
  const from = (page - 1) * size;
  const res = await qb.range(from, from + size - 1); chk(res);
  return { rows: res.data.map(fromRow), total: res.count || 0 };
}
export async function countApps(status) { let q = sb.from('applications').select('*', { count: 'exact', head: true }); if (status) q = q.eq('status', status); const res = await q; chk(res); return res.count || 0; }
export async function countSince(iso) { const res = await sb.from('applications').select('*', { count: 'exact', head: true }).gte('created_at', iso); chk(res); return res.count || 0; }
export async function countCitizens(verified) { let q = sb.from('citizens').select('*', { count: 'exact', head: true }); if (verified) q = q.eq('email_verified', true); const res = await q; chk(res); return res.count || 0; }
export async function appsSince(iso) { const res = await sb.from('applications').select('created_at').gte('created_at', iso).range(0, 999); chk(res); return res.data; }
export async function topServices() { const res = await sb.from('applications').select('service').order('created_at', { ascending: false }).range(0, 999); chk(res); return res.data; } // সর্বশেষ ১০০০ আবেদনের হিসাব
export async function listCitizens({ q, page = 1, size = 20 }) {
  let qb = sb.from('citizens').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  const s = clean(q);
  if (s) qb = qb.or(`email.ilike.%${s}%,name.ilike.%${s}%,name_bn.ilike.%${s}%,mobile.ilike.%${s}%,nid.ilike.%${s}%`);
  const from = (page - 1) * size;
  const res = await qb.range(from, from + size - 1); chk(res);
  return { rows: res.data.map(({ pass_hash, ...r }) => r), total: res.count || 0 };
}

// ===== উদ্যোক্তা =====
export async function listEnt({ status, page = 1, size = 20 }) {
  let qb = sb.from('citizens').select('*', { count: 'exact' }).not('ent_status', 'is', null).order('ent_at', { ascending: false });
  if (status) qb = qb.eq('ent_status', status);
  const from = (page - 1) * size;
  const res = await qb.range(from, from + size - 1); chk(res);
  return { rows: res.data.map(({ pass_hash, ...r }) => r), total: res.count || 0 };
}
export async function countEnt(status) { const res = await sb.from('citizens').select('*', { count: 'exact', head: true }).eq('ent_status', status); chk(res); return res.count || 0; }
export async function byFiler(id) { const res = await sb.from('applications').select('*').eq('filed_by', id).order('created_at', { ascending: false }).limit(200); chk(res); return res.data.map(fromRow); }

// ===== ওয়ালেট ও পেমেন্ট =====
export async function rpc(fn, args) { const res = await sb.rpc(fn, args); chk(res); return res.data; }
export async function delApp(no) { chk(await sb.from('applications').delete().eq('no', no)); }
export async function addTopup(r) {
  const res = await sb.from('topups').insert(r);
  if (res.error) { if (res.error.code === '23505') return 'dup'; throw new Error(res.error.message); }
  return 'ok';
}
export async function getTopup(id) { const res = await sb.from('topups').select('*').eq('id', id).maybeSingle(); chk(res); return res.data; }
export async function listTopups({ status, citizen, page = 1, size = 20 }) {
  let qb = sb.from('topups').select('*, citizens(name, name_bn, email)', { count: 'exact' }).order('created_at', { ascending: false });
  if (status) qb = qb.eq('status', status);
  if (citizen) qb = qb.eq('citizen_id', citizen);
  const from = (page - 1) * size;
  const res = await qb.range(from, from + size - 1); chk(res);
  return { rows: res.data, total: res.count || 0 };
}
export async function countTopups(status) { const res = await sb.from('topups').select('*', { count: 'exact', head: true }).eq('status', status); chk(res); return res.count || 0; }
export async function rejectTopup(id, note) {
  const res = await sb.from('topups').update({ status: 'rejected', note, decided_at: new Date().toISOString() }).eq('id', id).eq('status', 'pending').select(); chk(res);
  return res.data[0] || null;
}
export async function txByCitizen(id, n = 50) { const res = await sb.from('wallet_tx').select('*').eq('citizen_id', id).order('created_at', { ascending: false }).limit(n); chk(res); return res.data; }
export async function uploadQr(f) {
  const p = `settings/qr.${f.type === 'image/png' ? 'png' : 'jpg'}`;
  chk(await sb.storage.from('documents').upload(p, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: true }));
  return p;
}
