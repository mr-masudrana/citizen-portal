import { revalidatePath } from 'next/cache';
import { requireCitizen } from '../../lib/auth';
import { createComplaint, complaintsForCitizen } from '../../lib/db';

async function submitComplaint(fd) {
  'use server';
  const citizen = await requireCitizen('/support');
  const subject = String(fd.get('subject') || '').trim();
  const category = String(fd.get('category') || 'other');
  const message = String(fd.get('message') || '').trim();
  if (subject.length < 5 || subject.length > 160 || message.length < 10 || message.length > 5000) return;
  try { await createComplaint({ citizen_id: citizen.id, subject, category, message }); }
  catch (error) { console.error('Complaint submission failed; run supabase/phase11-support-notices.sql:', error?.message || error); return; }
  revalidatePath('/support');
}
const statusLabels = { submitted: 'জমা হয়েছে', in_review: 'পর্যালোচনাধীন', resolved: 'সমাধান হয়েছে', rejected: 'নিষ্পত্তি করা যায়নি' };
const categories = { service: 'সেবা সংক্রান্ত', application: 'আবেদন সংক্রান্ত', staff: 'কর্মকর্তা সংক্রান্ত', technical: 'প্রযুক্তিগত সমস্যা', other: 'অন্যান্য' };
export const dynamic = 'force-dynamic';
export default async function SupportPage() {
  const citizen = await requireCitizen('/support');
  let complaints = [];
  try { complaints = await complaintsForCitizen(citizen.id); }
  catch (error) { console.error('Could not load complaints; run phase11 migration:', error?.message || error); }
  return <div className="page">
    <h1>অভিযোগ ও সহায়তা</h1>
    <p className="sub">সেবা বা আবেদনের সমস্যা জানাতে নিচের ফর্ম ব্যবহার করুন। সংবেদনশীল পাসওয়ার্ড বা OTP লিখবেন না।</p>
    <section className="card" style={{maxWidth:760,marginBottom:24}}>
      <h2 style={{marginTop:0}}>নতুন অভিযোগ জমা দিন</h2>
      <form action={submitComplaint} style={{display:'grid',gap:12}}>
        <label>বিষয়<input name="subject" required minLength={5} maxLength={160} placeholder="সমস্যার সংক্ষিপ্ত বিষয়"/></label>
        <label>বিভাগ<select name="category" defaultValue="service">{Object.entries(categories).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label>বিস্তারিত<textarea name="message" required minLength={10} maxLength={5000} rows={5} placeholder="সমস্যাটি বিস্তারিত লিখুন"/></label>
        <button className="btn" type="submit">অভিযোগ জমা দিন</button>
      </form>
    </section>
    <h2>আমার অভিযোগসমূহ</h2>
    {complaints.length === 0 ? <p className="sub">এখনো কোনো অভিযোগ জমা দেওয়া হয়নি।</p> : <div className="tbl"><table><thead><tr><th>টিকিট</th><th>বিষয়</th><th>বিভাগ</th><th>অবস্থা</th><th>উত্তর</th><th>তারিখ</th></tr></thead><tbody>{complaints.map(c=><tr key={c.id}><td>{c.ticket_no}</td><td>{c.subject}</td><td>{categories[c.category] || c.category}</td><td>{statusLabels[c.status] || c.status}</td><td>{c.staff_reply || 'এখনো উত্তর দেওয়া হয়নি'}</td><td>{new Date(c.created_at).toLocaleDateString('bn-BD')}</td></tr>)}</tbody></table></div>}
  </div>;
}
