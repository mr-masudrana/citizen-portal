'use client';
import { useMemo, useState } from 'react';

const statusLabel = (s) => s === 'pending' ? 'অপেক্ষমাণ' : s === 'approved' ? 'অনুমোদিত' : s === 'rejected' ? 'বাতিল' : s;
const csvCell = (v) => { const raw = String(v ?? ''); const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw; return `"${safe.replace(/"/g, '""')}"`; };

export default function AdminApplications({ rows, urls, decideAction }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const services = useMemo(() => [...new Set(rows.map((r) => r.service).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return rows.filter((r) => {
      const matchesQuery = !q || [r.no, r.service, r.name, r.mobile, r.father, r.union_name, r.nid].some((v) => String(v || '').toLocaleLowerCase().includes(q));
      return matchesQuery && (status === 'all' || r.status === status) && (service === 'all' || r.service === service);
    });
  }, [rows, query, status, service]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const stats = useMemo(() => ({ total: rows.length, pending: rows.filter(r => r.status === 'pending').length, approved: rows.filter(r => r.status === 'approved').length, rejected: rows.filter(r => r.status === 'rejected').length }), [rows]);
  function exportCsv() {
    const header = ['আবেদন নম্বর', 'সেবা', 'আবেদনকারী', 'মোবাইল', 'অবস্থা', 'আবেদনের তারিখ', 'সিদ্ধান্তের তারিখ'];
    const lines = filtered.map(r => [r.no, r.service, r.name, r.mobile, statusLabel(r.status), r.createdAt || r.created_at, r.decidedAt || r.decided_at].map(csvCell).join(','));
    const blob = new Blob(['\ufeff' + [header.map(csvCell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'citizen-applications.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <div className="row" style={{ margin: '0 0 18px' }}>
      {[['মোট আবেদন', stats.total], ['অপেক্ষমাণ', stats.pending], ['অনুমোদিত', stats.approved], ['বাতিল', stats.rejected]].map(([label, value]) => <div className="card" key={label} style={{ margin: 0, minWidth: 130, flex: 1 }}><div className="sub">{label}</div><strong style={{ fontSize: 28 }}>{value}</strong></div>)}
    </div>
    <section className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 19 }}>আবেদন খুঁজুন ও ফিল্টার করুন</h2>
      <div className="row">
        <div style={{ flex: 2 }}><label htmlFor="admin-search">সার্চ</label><input id="admin-search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="আবেদন নম্বর, নাম, মোবাইল, NID…" /></div>
        <div><label htmlFor="admin-status">অবস্থা</label><select id="admin-status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="all">সব অবস্থা</option><option value="pending">অপেক্ষমাণ</option><option value="approved">অনুমোদিত</option><option value="rejected">বাতিল</option></select></div>
        <div><label htmlFor="admin-service">সেবা</label><select id="admin-service" value={service} onChange={e => { setService(e.target.value); setPage(1); }}><option value="all">সব সেবা</option>{services.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 12 }}><span className="sub">{filtered.length}টি আবেদন পাওয়া গেছে</span><button className="btn out" type="button" onClick={exportCsv}>CSV রিপোর্ট ডাউনলোড</button></div>
    </section>
    <div className="tbl"><table>
      <thead><tr><th>নম্বর</th><th>সনদ</th><th>আবেদনকারী</th><th>মোবাইল</th><th>নথি ও বিবরণ</th><th>অবস্থা</th><th>কাজ</th></tr></thead>
      <tbody>{visible.map((r) => {
        const docs = urls[r.no] || [];
        return <tr key={r.no}><td>{r.no}<br/><small>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('bn-BD') : ''}</small></td><td>{r.service}</td><td>{r.name}{r.father ? <><br/><small>পিতা: {r.father}</small></> : null}{r.union_name ? <><br/><small>ইউনিয়ন: {r.union_name}</small></> : null}</td><td>{r.mobile}</td>
          <td>{docs.map((u, j) => <div key={u.p}>{u.url ? <a href={u.url} target="_blank" rel="noreferrer">নথি {j + 1}</a> : <span>নথি {j + 1} অনুপলব্ধ</span>}</div>)}{r.extra?.heirs && <details><summary>ওয়ারিশ ({r.extra.heirs.length})</summary><div>মৃত: {r.extra.dname}, পিতা: {r.extra.dfather || '—'}</div><ol>{r.extra.heirs.map((h, n) => <li key={n}>{h.name} ({h.rel}) {h.nid}</li>)}</ol></details>}</td>
          <td>{statusLabel(r.status)}</td><td>{r.status === 'pending' ? <form action={decideAction} style={{ display: 'flex', gap: 8 }}><input type="hidden" name="no" value={r.no}/><button className="btn" style={{ margin: 0 }} name="s" value="approved">অনুমোদন</button><button className="btn red" style={{ margin: 0 }} name="s" value="rejected">বাতিল</button></form> : <span className="sub">সিদ্ধান্ত সম্পন্ন</span>}</td></tr>;
      })}</tbody>
    </table></div>
    {visible.length === 0 && <p className="sub">এই ফিল্টারে কোনো আবেদন পাওয়া যায়নি।</p>}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}><span className="sub">পৃষ্ঠা {currentPage} / {pages}</span><div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn out" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>আগের</button><button type="button" className="btn out" disabled={currentPage >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>পরের</button></div></div>
  </>;
}
