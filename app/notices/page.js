import { publishedNotices } from '../../lib/db';
export const dynamic = 'force-dynamic';
const labels = { general: 'সাধারণ', service: 'সেবা', urgent: 'জরুরি', meeting: 'সভা' };
export default async function NoticesPage() {
  let notices = [];
  try { notices = await publishedNotices(100); }
  catch (error) { console.error('Could not load notices; run phase11 migration:', error?.message || error); }
  return <div className="page"><h1>নোটিশ বোর্ড</h1><p className="sub">ইউনিয়ন পরিষদের প্রকাশিত নোটিশ ও ঘোষণা।</p>
    {notices.length === 0 ? <section className="card"><p>বর্তমানে কোনো প্রকাশিত নোটিশ নেই।</p></section> : <div style={{display:'grid',gap:14}}>{notices.map(n=><article className="card" key={n.id} style={{maxWidth:900}}><div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}><span className={`badge ${n.category==='urgent'?'bad':'ok'}`}>{labels[n.category] || n.category}</span><small className="sub">{n.published_at ? new Date(n.published_at).toLocaleDateString('bn-BD') : ''}</small></div><h2>{n.title}</h2><p style={{whiteSpace:'pre-wrap',lineHeight:1.8}}>{n.body}</p>{n.expires_at ? <small className="sub">কার্যকর থাকবে: {new Date(n.expires_at).toLocaleDateString('bn-BD')} পর্যন্ত</small> : null}</article>)}</div>}
  </div>;
}
