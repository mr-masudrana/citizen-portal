import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '../../../lib/admin';
import { getSettings, saveSettings } from '../../../lib/db';
import { Icon } from '../../../lib/icons';
export const dynamic = 'force-dynamic';
async function saveSet(fd) {
  'use server';
  if (!isAdmin()) return;
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 100);
  await saveSettings({ union_name: g('union_name'), upazila: g('upazila'), district: g('district') });
  revalidatePath('/admin/settings');
  redirect('/admin/settings?ok=1');
}
export default async function Settings({ searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const st = await getSettings(), e = process.env;
  const sys = [['SMTP (ইমেইল পাঠানো)', !!e.SMTP_HOST], ['SITE_URL (ইমেইল ও QR লিংক)', !!e.SITE_URL], ['SESSION_SECRET', !!e.SESSION_SECRET], ['ADMIN_KEY', !!e.ADMIN_KEY], ['Supabase সংযোগ', !!e.SUPABASE_URL && !!e.SUPABASE_SERVICE_KEY]];
  return (
    <>
      <h1>সেটিংস</h1><p className="sub">সনদের শিরোনাম ও সিস্টেমের অবস্থা</p>
      {sp.ok && <p className="badge ok">সংরক্ষণ হয়েছে।</p>}
      <div className="adm-grid">
        <form className="card adm-sec" action={saveSet}>
          <h2>ইউনিয়ন পরিষদের তথ্য</h2><p className="sub" style={{ margin: '2px 0 0' }}>সনদের শিরোনামে ও যাচাই পেজে এই তথ্য ছাপা হবে।</p>
          <label htmlFor="s1">ইউনিয়ন পরিষদের নাম</label><input id="s1" name="union_name" defaultValue={st.union_name || ''} placeholder="যেমন: ৬ নং ... ইউনিয়ন পরিষদ" />
          <label htmlFor="s2">উপজেলা</label><input id="s2" name="upazila" defaultValue={st.upazila || ''} />
          <label htmlFor="s3">জেলা</label><input id="s3" name="district" defaultValue={st.district || ''} />
          <button className="btn"><Icon n="check" size={18} /> সংরক্ষণ করুন</button>
        </form>
        <section className="card adm-sec"><h2>সিস্টেমের অবস্থা</h2>
          {sys.map(([l, ok]) => <div key={l} className="kv"><span>{l}</span><span className={`badge ${ok ? 'ok' : 'bad'}`}>{ok ? 'ঠিক আছে' : 'সেট নেই'}</span></div>)}
          <p className="sub" style={{ margin: '12px 0 0', fontSize: 14 }}>মান বদলাতে হোস্টিংয়ের Environment Variables-এ গিয়ে বদলে নতুন করে ডিপ্লয় করুন।</p>
        </section>
      </div>
    </>
  );
}
