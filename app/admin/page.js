import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createHash, timingSafeEqual } from 'crypto';
import { isAdmin, startAdmin, adminConfigured, adminLocked, adminFail, adminOk, decide, dt } from '../../lib/admin';
import { countEnt, countApps, countSince, countCitizens, appsSince, topServices, listApps, listCitizens } from '../../lib/db';
import { Icon } from '../../lib/icons';
import { bn } from '../../lib/templates';
export const dynamic = 'force-dynamic';
const dg = (s) => createHash('sha256').update(String(s)).digest();
async function login(fd) {
  'use server';
  if (!adminConfigured()) return;
  if (await adminLocked()) redirect('/admin?e=locked');
  if (!timingSafeEqual(dg(fd.get('key') || ''), dg(process.env.ADMIN_KEY))) { await adminFail(); redirect('/admin?e=bad'); }
  await adminOk(); startAdmin();
  redirect('/admin');
}
async function quickApprove(fd) {
  'use server';
  if (!isAdmin()) return;
  await decide(String(fd.get('no')), 'approved', '', true);
  revalidatePath('/admin');
  redirect('/admin?ok=1');
}
const dhaka = () => { const n = new Date(Date.now() + 6 * 36e5); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) - 6 * 36e5); };
function Login({ e }) {
  return (
    <div className="page" style={{ maxWidth: 460 }}>
      <h1>অ্যাডমিন প্রবেশ</h1>
      {!adminConfigured() && <p className="badge bad">.env ফাইলে ADMIN_KEY ও SESSION_SECRET সেট করুন।</p>}
      {e === 'bad' && <p className="badge bad">অ্যাডমিন কী ঠিক নেই।</p>}
      {e === 'locked' && <p className="badge bad">অনেকবার ভুল হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।</p>}
      <form className="card" action={login}>
        <label htmlFor="key" style={{ marginTop: 0 }}>অ্যাডমিন কী</label><input id="key" name="key" type="password" autoComplete="off" required />
        <button className="btn" style={{ width: '100%' }}><Icon n="lock" size={18} /> প্রবেশ করুন</button>
      </form>
    </div>
  );
}
export default async function Admin({ searchParams }) {
  if (!isAdmin()) return <Login e={searchParams.e} />;
  const start = dhaka(), since = new Date(start.getTime() - 13 * 864e5);
  const [total, pending, approved, rejected, today, cit, vcit, recent, svc, queue, newCit] = await Promise.all([
    countApps(), countApps('pending'), countApps('approved'), countApps('rejected'), countSince(start.toISOString()), countCitizens(), countCitizens(true),
    appsSince(since.toISOString()), topServices(), listApps({ status: 'pending', asc: true, size: 8 }), listCitizens({ size: 6 }),
  ]);
  const entPending = await countEnt('pending');
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(since.getTime() + i * 864e5 + 6 * 36e5); return { k: d.toISOString().slice(0, 10), n: 0, l: bn(d.getUTCDate()) }; });
  recent.forEach((r) => { const k = new Date(new Date(r.created_at).getTime() + 6 * 36e5).toISOString().slice(0, 10); const d = days.find((x) => x.k === k); if (d) d.n++; });
  const max = Math.max(1, ...days.map((d) => d.n));
  const cnt = {}; svc.forEach((r) => (cnt[r.service] = (cnt[r.service] || 0) + 1));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8), topMax = top[0]?.[1] || 1;
  const cards = [['মোট আবেদন', total, 'file', ''], ['অপেক্ষমাণ', pending, 'clock', 'warn'], ['অনুমোদিত', approved, 'check', 'ok'], ['বাতিল', rejected, 'x', 'bad'], ['আজকের আবেদন', today, 'chart', ''], ['মোট নাগরিক', cit, 'users', ''], ['ইমেইল যাচাইকৃত', vcit, 'mail', ''], ['উদ্যোক্তা আবেদন', entPending, 'briefcase', 'warn']];
  const pc = (n) => (total ? (n / total) * 100 : 0);
  return (
    <>
      <h1>ড্যাশবোর্ড</h1>
      <p className="sub">আবেদন ও নাগরিকের সার্বিক চিত্র</p>
      {searchParams.ok && <p className="badge ok">কাজটি সম্পন্ন হয়েছে।</p>}
      <div className="adm-cards">{cards.map(([l, n, ic, c], i) => (
        <div key={l} className={`adm-stat ${c}`} style={{ '--n': i }}><span className="ic"><Icon n={ic} /></span><div><b>{bn(n)}</b><span>{l}</span></div></div>
      ))}</div>
      <div className="adm-grid">
        <div>
          <section className="card adm-sec">
            <h2>গত ১৪ দিনের আবেদন</h2>
            <div className="bars" role="img" aria-label="গত ১৪ দিনের আবেদনের সংখ্যা">{days.map((d) => <div key={d.k}><span>{d.n ? bn(d.n) : ''}</span><i style={{ height: `${(d.n / max) * 100}%` }} /><em>{d.l}</em></div>)}</div>
            <div className="stack" aria-hidden="true"><i className="s-ok" style={{ width: `${pc(approved)}%` }} /><i className="s-warn" style={{ width: `${pc(pending)}%` }} /><i className="s-bad" style={{ width: `${pc(rejected)}%` }} /></div>
            <p className="sub" style={{ margin: '8px 0 0', fontSize: 14 }}>সবুজ: অনুমোদিত · হলুদ: অপেক্ষমাণ · লাল: বাতিল</p>
          </section>
          <section className="card adm-sec">
            <div className="sec-h"><h2>অপেক্ষমাণ আবেদন (পুরোনো আগে)</h2><a className="btn out sm" href="/admin/applications?status=pending">সব দেখুন</a></div>
            {queue.rows.length === 0 ? <p className="sub">কোনো অপেক্ষমাণ আবেদন নেই।</p> : (
              <div className="tbl"><table><thead><tr><th>নম্বর</th><th>সনদ</th><th>আবেদনকারী</th><th>তারিখ</th><th>কাজ</th></tr></thead>
                <tbody>{queue.rows.map((a) => (
                  <tr key={a.no}><td><a href={`/admin/applications/${a.no}`}>{a.no}</a></td><td>{a.service}</td><td>{a.name_bn || a.name}</td><td>{dt(a.createdAt)}</td>
                    <td><form action={quickApprove} style={{ display: 'flex', gap: 6 }}><input type="hidden" name="no" value={a.no} /><a className="btn out sm" href={`/admin/applications/${a.no}`}><Icon n="eye" size={15} /> দেখুন</a><button className="btn sm"><Icon n="check" size={15} /> অনুমোদন</button></form></td></tr>
                ))}</tbody></table></div>
            )}
          </section>
        </div>
        <div>
          <section className="card adm-sec">
            <h2>জনপ্রিয় সেবা</h2>
            {top.length === 0 ? <p className="sub">এখনো ডেটা নেই।</p> : top.map(([s, n]) => <div key={s} className="hbar"><span>{s}</span><div><i style={{ width: `${(n / topMax) * 100}%` }} /></div><b>{bn(n)}</b></div>)}
            <p className="sub" style={{ margin: '8px 0 0', fontSize: 13 }}>সর্বশেষ ১০০০ আবেদনের ভিত্তিতে</p>
          </section>
          <section className="card adm-sec">
            <div className="sec-h"><h2>নতুন নাগরিক</h2><a className="btn out sm" href="/admin/citizens">সব দেখুন</a></div>
            {newCit.rows.map((c) => <a key={c.id} className="adm-li" href={`/admin/citizens/${c.id}`}><b>{c.name_bn || c.name}</b><span>{c.email}</span></a>)}
          </section>
        </div>
      </div>
    </>
  );
}
