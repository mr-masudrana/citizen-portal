import { requireCitizen, percent } from '../../lib/auth';
import { revalidatePath } from 'next/cache';
import { byCitizen, getActiveCertificateForApplication, notificationsForCitizen, markCitizenNotificationsRead, paymentsForCitizen, submitCitizenPaymentReference, get } from '../../lib/db';
const L = { pending: ['অনুমোদনের অপেক্ষায়', 'warn'], approved: ['অনুমোদিত', 'ok'], rejected: ['বাতিল', 'bad'] };
const PAYMENT_LABEL = { due: 'ফি বাকি', submitted: 'যাচাইয়ের অপেক্ষায়', paid: 'পরিশোধিত', rejected: 'রেফারেন্স প্রত্যাখ্যাত', waived: 'ফি মওকুফ' };
async function submitPaymentReferenceAction(fd) {
  'use server';
  const u = await requireCitizen('/dashboard');
  const no = String(fd.get('application_no') || '').trim();
  const reference = String(fd.get('reference') || '').trim();
  const app = await get(no);
  if (!app || app.citizen_id !== u.id || !['pending','approved'].includes(app.status) || reference.length < 3 || reference.length > 120) return;
  try { if (await submitCitizenPaymentReference(no, u.id, reference)) revalidatePath('/dashboard'); }
  catch (error) { console.error('Payment reference submission failed; run supabase/phase10-finance.sql:', error?.message || error); }
}
export default async function Dashboard() {
  const u = await requireCitizen('/dashboard');
  const pc = percent(u), apps = await byCitizen(u.id);
  let payments = [];
  try { payments = await paymentsForCitizen(u.id); } catch (error) { console.error('Run supabase/phase10-finance.sql:', error?.message || error); }
  let notifications = [];
  try { notifications = await notificationsForCitizen(u.id, 20); } catch (error) { console.error('Run supabase/phase7-notifications-password.sql:', error?.message || error); }
  const activeCerts = Object.fromEntries(await Promise.all(apps.filter(a => a.status === 'approved').map(async a => [a.no, await getActiveCertificateForApplication(a.no)])));
  return (
    <div className="page">
      <h1>স্বাগতম, {u.name}</h1>
      <div className="card" style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>প্রোফাইল সম্পূর্ণতা</span><span>{pc}%</span></div>
        <div className="bar" role="progressbar" aria-valuenow={pc} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pc}%` }} /></div>
        {pc < 100
          ? <><p className="sub" style={{ margin: '10px 0 0' }}>সেবার আবেদন করতে প্রোফাইল ১০০% সম্পূর্ণ করুন।</p><a className="btn" href="/profile">প্রোফাইল সম্পূর্ণ করুন</a></>
          : <a className="btn" href="/#services">সেবার আবেদন করুন</a>}
      </div>
      <section className="card" style={{marginBottom:20}}><h2 style={{fontSize:20,marginTop:0}}>নোটিফিকেশন</h2>{notifications.length === 0 ? <p className="sub">এখনো কোনো নোটিফিকেশন নেই।</p> : <div style={{display:'grid',gap:10}}>{notifications.map(n => <div key={n.id} style={{borderLeft:`4px solid ${n.kind === 'success' ? '#218838' : n.kind === 'warning' ? '#b8860b' : '#64748b'}`,padding:'8px 12px',background:'var(--card, #f8fafc)',borderRadius:6}}><strong>{n.title}</strong><p style={{margin:'4px 0'}}>{n.message}</p><small className="sub">{new Date(n.created_at).toLocaleString('bn-BD')}</small>{n.application_no && <div><a href={`/track?no=${encodeURIComponent(n.application_no)}`}>আবেদন দেখুন</a></div>}</div>)}</div>}</section>
      <section className="card" style={{marginBottom:20}}><h2 style={{fontSize:20,marginTop:0}}>সেবা ফি ও পেমেন্ট</h2><p className="sub">এটি বর্তমানে অফলাইন পেমেন্ট রেফারেন্স জমা ও কর্মকর্তা কর্তৃক যাচাইয়ের ব্যবস্থা। এখানে কোনো অনলাইন পেমেন্ট গেটওয়ে সংযুক্ত নেই।</p>{payments.length === 0 ? <p className="sub">কোনো বকেয়া ফি নেই অথবা ফি এখনো প্রশাসক নির্ধারণ করেননি।</p> : <div className="tbl"><table><thead><tr><th>আবেদন</th><th>সেবা</th><th>ফি</th><th>অবস্থা</th><th>পেমেন্ট রেফারেন্স</th></tr></thead><tbody>{payments.map(p => <tr key={p.id}><td>{p.application_no}</td><td>{p.service}</td><td>৳{(p.amount_paisa/100).toLocaleString('bn-BD',{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>{PAYMENT_LABEL[p.status] || p.status}{p.admin_note ? <div className="sub">{p.admin_note}</div> : null}</td><td>{['due','rejected'].includes(p.status) ? <form action={submitPaymentReferenceAction} style={{display:'grid',gap:6,minWidth:180}}><input type="hidden" name="application_no" value={p.application_no}/><input name="reference" required minLength={3} maxLength={120} placeholder="ব্যাংক/মোবাইল লেনদেন রেফারেন্স"/><button className="btn" style={{margin:0}}>যাচাইয়ের জন্য জমা দিন</button></form> : p.payer_reference || '—'}</td></tr>)}</tbody></table></div>}</section>
      <h2 style={{ fontSize: 22 }}>আমার আবেদনসমূহ</h2>
      {apps.length === 0 ? <p className="sub">এখনো কোনো আবেদন করেননি।</p> : (
        <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th><th>অবস্থা</th><th>কাজ</th></tr></thead>
          <tbody>{apps.map((a) => (
            <tr key={a.no}><td>{a.no}</td><td>{a.service}</td><td><span className={`badge ${L[a.status][1]}`}>{L[a.status][0]}</span></td>
              <td>{a.status === 'approved' && activeCerts[a.no] ? <><a href={`/certificate/${a.no}`}>সনদ দেখুন</a> · <a href={`/certificate/${a.no}/pdf`}>PDF ডাউনলোড</a><br/><small>সনদ নং: {activeCerts[a.no].certificate_no}</small></> : a.status === 'approved' ? <span className="sub">সনদ প্রস্তুত হচ্ছে</span> : <a href={`/track?no=${a.no}&mobile=${a.mobile}`}>অবস্থা</a>}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
