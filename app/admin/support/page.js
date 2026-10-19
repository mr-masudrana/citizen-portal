import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createHmac, timingSafeEqual } from 'crypto';
import { getStaffById, listComplaints, updateComplaint, listNotices, saveNotice, writeAuditLog, createCitizenNotification } from '../../../lib/db';

export const dynamic = 'force-dynamic';
const secret = () => process.env.ADMIN_KEY || '';
const signature = (payload) => createHmac('sha256', secret()).update(`role:${payload}`).digest('hex');
async function roleNow() {
  const key = secret(); if (key.length < 32) return 'invalid';
  const admin = cookies().get('admin')?.value || '';
  const ap = admin.split('.');
  if (ap.length !== 3 || admin.length > 200) return 'invalid';
  const [issued, nonce, sig] = ap; const issuedAt = Number(issued);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > Date.now()+60000 || Date.now()-issuedAt > 8*60*60*1000 || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(sig)) return 'invalid';
  const expectedAdmin = createHmac('sha256', key).update(`${issued}.${nonce}`).digest('hex');
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedAdmin))) return 'invalid';
  const raw = cookies().get('admin_role')?.value || ''; const p = raw.split('.');
  if (p.length !== 4) return 'invalid';
  const [role, staffId, expRaw, roleSig] = p; const exp = Number(expRaw);
  if (!['super_admin','admin','reviewer','viewer'].includes(role) || !Number.isSafeInteger(exp) || exp <= Date.now() || exp > Date.now()+8*60*60*1000+60000 || !/^[a-f0-9]{64}$/.test(roleSig)) return 'invalid';
  const expected = Buffer.from(signature(`${role}.${staffId}.${expRaw}`)); const actual = Buffer.from(roleSig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return 'invalid';
  if (role === 'super_admin') return staffId === 'root' ? role : 'invalid';
  if (!/^[0-9a-f-]{36}$/i.test(staffId)) return 'invalid';
  const staff = await getStaffById(staffId);
  return staff?.active && staff.role === role ? role : 'invalid';
}
async function audit(action, type, id, details = {}) { try { await writeAuditLog({ action, entity_type:type, entity_id:id, details }); } catch (e) { console.error('Phase 11 audit log failed:', e?.message || e); } }
async function updateComplaintAction(fd) {
  'use server';
  const role = await roleNow(); if (!['super_admin','admin','reviewer'].includes(role)) return;
  const id = String(fd.get('id') || ''); const status = String(fd.get('status') || ''); const reply = String(fd.get('staff_reply') || '').trim();
  try {
    const updated = await updateComplaint({ id, status, staff_reply: reply });
    if (updated) {
      await audit('complaint_updated','complaint',id,{ status });
      await createCitizenNotification({ citizen_id: updated.citizen_id, title: 'অভিযোগের অবস্থা আপডেট হয়েছে', message: `আপনার অভিযোগ ${updated.ticket_no}-এর বর্তমান অবস্থা: ${({in_review:'পর্যালোচনাধীন',resolved:'সমাধান হয়েছে',rejected:'নিষ্পত্তি করা যায়নি'})[status]}. ${reply}`.slice(0,1000), kind: status === 'resolved' ? 'success' : 'info' });
    }
  } catch (e) { console.error('Complaint update failed; check phase11 migration:', e?.message || e); }
  revalidatePath('/admin/support');
}
async function createNoticeAction(fd) {
  'use server';
  const role = await roleNow(); if (!['super_admin','admin'].includes(role)) return;
  const title = String(fd.get('title') || '').trim(); const body = String(fd.get('body') || '').trim(); const category = String(fd.get('category') || 'general'); const status = String(fd.get('status') || 'draft'); const expires = String(fd.get('expires_at') || '').trim();
  try { const id = await saveNotice({ title, body, category, status, expires_at: expires ? new Date(`${expires}T23:59:59+06:00`).toISOString() : null }); if (id) await audit('notice_created','notice',id,{ category,status }); }
  catch (e) { console.error('Notice creation failed; check phase11 migration:', e?.message || e); }
  revalidatePath('/admin/support'); revalidatePath('/notices');
}
async function archiveNoticeAction(fd) {
  'use server';
  const role = await roleNow(); if (!['super_admin','admin'].includes(role)) return;
  const id = String(fd.get('id') || '');
  try { const rows = await listNotices(); const n = rows.find(x=>x.id===id); if (n) { await saveNotice({ id, title:n.title, body:n.body, category:n.category, status:'archived', expires_at:n.expires_at }); await audit('notice_archived','notice',id,{}); } }
  catch (e) { console.error('Notice archive failed:', e?.message || e); }
  revalidatePath('/admin/support'); revalidatePath('/notices');
}
const complaintStatus = { submitted:'জমা হয়েছে', in_review:'পর্যালোচনাধীন', resolved:'সমাধান হয়েছে', rejected:'নিষ্পত্তি করা যায়নি' };
export default async function AdminSupportPage() {
  const role = await roleNow();
  if (!['super_admin','admin','reviewer','viewer'].includes(role)) return <div className="page"><h1>অ্যাক্সেস সীমাবদ্ধ</h1><p>এই পেজ দেখতে অ্যাডমিন হিসেবে লগইন করুন।</p><a className="btn" href="/admin">অ্যাডমিন লগইন</a></div>;
  let complaints = [], notices = [];
  if (['super_admin','admin','reviewer'].includes(role)) try { complaints = await listComplaints(); } catch(e) { console.error('Could not load complaints:',e?.message||e); }
  if (['super_admin','admin'].includes(role)) try { notices = await listNotices(); } catch(e) { console.error('Could not load notices:',e?.message||e); }
  return <div className="page"><h1>নাগরিক সহায়তা ব্যবস্থাপনা</h1><p className="sub">আপনার ভূমিকা: {({super_admin:'সুপার অ্যাডমিন',admin:'অ্যাডমিন',reviewer:'রিভিউয়ার',viewer:'ভিউয়ার'})[role]}</p>
    {role==='viewer'?<section className="card" style={{marginBottom:24}}><h2 style={{marginTop:0}}>অভিযোগসমূহ</h2><p className="sub">আপনার ভূমিকার জন্য অভিযোগের ব্যক্তিগত তথ্য দেখার অনুমতি নেই।</p></section>:<section className="card" style={{marginBottom:24}}><h2 style={{marginTop:0}}>অভিযোগসমূহ</h2>{complaints.length===0?<p className="sub">কোনো অভিযোগ পাওয়া যায়নি।</p>:<div style={{display:'grid',gap:14}}>{complaints.map(c=><article key={c.id} className="card" style={{background:'var(--card, #f8fafc)'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><strong>{c.ticket_no} · {c.subject}</strong><span className="badge">{complaintStatus[c.status]||c.status}</span></div><p className="sub">নাগরিক ID: {c.citizen_id} · {new Date(c.created_at).toLocaleString('bn-BD')}</p><p style={{whiteSpace:'pre-wrap'}}>{c.message}</p>{role!=='viewer'?<form action={updateComplaintAction} style={{display:'grid',gap:8}}><input type="hidden" name="id" value={c.id}/><label>অবস্থা<select name="status" defaultValue={c.status==='submitted'?'in_review':c.status}>{[['in_review','পর্যালোচনাধীন'],['resolved','সমাধান হয়েছে'],['rejected','নিষ্পত্তি করা যায়নি']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>নাগরিককে উত্তর<textarea name="staff_reply" maxLength={3000} rows={3} defaultValue={c.staff_reply||''} placeholder="উত্তর বা পরবর্তী করণীয়"/></label><button className="btn">আপডেট ও নোটিফিকেশন পাঠান</button></form>:<p>{c.staff_reply||'কোনো উত্তর নেই'}</p>}</article>)}</div>}</section>}
    {['super_admin','admin'].includes(role)?<><section className="card" style={{marginBottom:24}}><h2 style={{marginTop:0}}>নতুন নোটিশ প্রকাশ</h2><form action={createNoticeAction} style={{display:'grid',gap:10}}><label>শিরোনাম<input name="title" required minLength={5} maxLength={180}/></label><label>বিস্তারিত<textarea name="body" required minLength={10} maxLength={10000} rows={5}/></label><label>বিভাগ<select name="category"><option value="general">সাধারণ</option><option value="service">সেবা</option><option value="urgent">জরুরি</option><option value="meeting">সভা</option></select></label><label>মেয়াদ শেষ (ঐচ্ছিক)<input type="date" name="expires_at"/></label><label>প্রকাশের অবস্থা<select name="status"><option value="draft">খসড়া</option><option value="published">প্রকাশ করুন</option></select></label><button className="btn">নোটিশ সংরক্ষণ</button></form></section>
    <section className="card"><h2 style={{marginTop:0}}>নোটিশের তালিকা</h2>{notices.length===0?<p className="sub">কোনো নোটিশ নেই।</p>:<div className="tbl"><table><thead><tr><th>শিরোনাম</th><th>অবস্থা</th><th>তারিখ</th><th>কাজ</th></tr></thead><tbody>{notices.map(n=><tr key={n.id}><td>{n.title}</td><td>{({draft:'খসড়া',published:'প্রকাশিত',archived:'আর্কাইভ'})[n.status]||n.status}</td><td>{new Date(n.created_at).toLocaleDateString('bn-BD')}</td><td>{n.status!=='archived'?<form action={archiveNoticeAction}><input type="hidden" name="id" value={n.id}/><button className="btn" style={{margin:0}}>আর্কাইভ</button></form>:'—'}</td></tr>)}</tbody></table></div>}</section></>:null}
    <p style={{marginTop:20}}><a href="/admin">← মূল অ্যাডমিন ড্যাশবোর্ড</a></p>
  </div>;
}
