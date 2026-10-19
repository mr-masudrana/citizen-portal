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
