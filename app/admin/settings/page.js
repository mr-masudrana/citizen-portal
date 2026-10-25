import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import { isAdmin } from '../../../lib/admin';
import { getSettings, saveSettings, uploadQr, docUrls } from '../../../lib/db';
import { SERVICES } from '../../../lib/services';
import { validPayload } from '../../../lib/banglaqr';
import { Icon } from '../../../lib/icons';
export const dynamic = 'force-dynamic';
async function saveSet(fd) {
  'use server';
  if (!isAdmin()) return;
  const g = (k) => String(fd.get(k) || '').trim().slice(0, 100);
  await saveSettings({ union_name: g('union_name'), upazila: g('upazila'), district: g('district') });
  revalidatePath('/admin/settings'); redirect('/admin/settings?ok=1');
}
async function savePay(fd) {
  'use server';
  if (!isAdmin()) return;
  const payload = String(fd.get('qr_payload') || '').trim().slice(0, 1200);
  const p = { pay_name: String(fd.get('pay_name') || '').trim().slice(0, 100), pay_note: String(fd.get('pay_note') || '').trim().slice(0, 300), qr_payload: payload, qr_dynamic: !!fd.get('qr_dynamic') && validPayload(payload) };
  const f = fd.get('qr_image');
  if (f && f.size > 0) {
    if (!['image/jpeg', 'image/png'].includes(f.type) || f.size > 1048576) redirect('/admin/settings?e=img');
    p.qr_image = await uploadQr(f);
  }
  await saveSettings(p);
  revalidatePath('/admin/settings'); redirect('/admin/settings?ok=1');
}
async function saveFees(fd) {
  'use server';
  if (!isAdmin()) return;
  const fees = {};
  for (const [i, s] of SERVICES.entries()) {
    const v = String(fd.get(`fee_${i}`) || '0').trim() || '0';
    if (!/^\d{1,6}$/.test(v)) redirect('/admin/settings?e=fee');
    if (Number(v) > 0) fees[s] = Number(v);
  }
  await saveSettings({ fees });
  revalidatePath('/admin/settings'); redirect('/admin/settings?ok=1');
}
export default async function Settings({ searchParams: sp }) {
  if (!isAdmin()) redirect('/admin');
  const st = await getSettings(), e = process.env, fees = st.fees || {};
  const sys = [['SMTP (ইমেইল পাঠানো)', !!e.SMTP_HOST], ['SITE_URL (ইমেইল ও QR লিংক)', !!e.SITE_URL], ['SESSION_SECRET', !!e.SESSION_SECRET], ['ADMIN_KEY', !!e.ADMIN_KEY], ['Supabase সংযোগ', !!e.SUPABASE_URL && !!e.SUPABASE_SERVICE_KEY]];
  const emv = st.qr_payload ? validPayload(st.qr_payload) : false;
  const prev = st.qr_payload ? await QRCode.toDataURL(st.qr_payload, { margin: 1, width: 220 }) : st.qr_image ? (await docUrls([st.qr_image]))[0]?.url : '';
  return (
    <>
      <h1>সেটিংস</h1><p className="sub">সনদের শিরোনাম, পেমেন্ট, সেবার ফি ও সিস্টেমের অবস্থা</p>
      {sp.ok && <p className="badge ok">সংরক্ষণ হয়েছে।</p>}
      {sp.e === 'img' && <p className="badge bad">QR ছবি JPG বা PNG এবং ১ MB-এর মধ্যে হতে হবে।</p>}
      {sp.e === 'fee' && <p className="badge bad">ফি শুধু পূর্ণ সংখ্যা (টাকা) হতে হবে।</p>}
      <div className="adm-grid">
        <div>
          <form className="card adm-sec" action={saveSet}>
            <h2>ইউনিয়ন পরিষদের তথ্য</h2><p className="sub" style={{ margin: '2px 0 0' }}>সনদের শিরোনামে ও যাচাই পেজে এই তথ্য ছাপা হবে।</p>
            <label htmlFor="s1">ইউনিয়ন পরিষদের নাম</label><input id="s1" name="union_name" defaultValue={st.union_name || ''} placeholder="যেমন: ৬ নং ... ইউনিয়ন পরিষদ" />
            <label htmlFor="s2">উপজেলা</label><input id="s2" name="upazila" defaultValue={st.upazila || ''} />
            <label htmlFor="s3">জেলা</label><input id="s3" name="district" defaultValue={st.district || ''} />
            <button className="btn"><Icon n="check" size={18} /> সংরক্ষণ করুন</button>
          </form>
          <form className="card adm-sec" action={savePay}>
            <h2>পেমেন্ট (বাংলা QR)</h2>
            <p className="sub" style={{ margin: '2px 0 0' }}>আপনার মার্চেন্ট বাংলা QR এখানে দিন। নাগরিক সেটি স্ক্যান করে পেমেন্ট করবেন।</p>
            <label htmlFor="pn">প্রাপকের নাম (QR-এর নিচে দেখাবে)</label><input id="pn" name="pay_name" defaultValue={st.pay_name || ''} />
            <label htmlFor="pp">QR-এর লেখা (ঐচ্ছিক, QR স্ক্যানার অ্যাপে দেখা যায়)</label><textarea id="pp" name="qr_payload" rows={4} defaultValue={st.qr_payload || ''} placeholder="00020101021126..." />
            {st.qr_payload && <p className={`badge ${emv ? 'ok' : 'warn'}`} style={{ marginTop: 8 }}>{emv ? 'বৈধ বাংলা QR (EMV)' : 'EMV ধাঁচের নয়, QR যেমন আছে তেমন দেখানো হবে, পরিমাণ বসানো যাবে না'}</p>}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}><input type="checkbox" name="qr_dynamic" defaultChecked={!!st.qr_dynamic} style={{ width: 'auto', marginTop: 5 }} /><span>QR-এ পরিমাণ নিজে থেকে বসাও। চালু করার আগে নিজের ফোনের অ্যাপে স্ক্যান করে পরীক্ষা করুন।</span></label>
            <label htmlFor="qi">অথবা QR-এর ছবি (JPG/PNG, ১ MB; লেখা দিলে ছবির বদলে লেখা থেকে QR বানানো হয়)</label><input id="qi" name="qr_image" type="file" accept="image/jpeg,image/png" />
            <label htmlFor="pq">পেমেন্ট নির্দেশনা (ঐচ্ছিক)</label><textarea id="pq" name="pay_note" rows={2} defaultValue={st.pay_note || ''} />
            <button className="btn"><Icon n="check" size={18} /> সংরক্ষণ করুন</button>
          </form>
          <form className="card adm-sec" action={saveFees}>
            <h2>সেবার ফি (টাকা)</h2><p className="sub" style={{ margin: '2px 0 8px' }}>০ বা ফাঁকা মানে বিনামূল্যে। আবেদন জমার সময় আবেদনকারীর ওয়ালেট থেকে কাটা হয়, বাতিল হলে ফেরত যায়।</p>
            <div className="row">{SERVICES.map((s, i) => <div key={s}><label htmlFor={`fee_${i}`} style={{ marginTop: 6 }}>{s}</label><input id={`fee_${i}`} name={`fee_${i}`} type="number" min="0" step="1" defaultValue={fees[s] || ''} placeholder="০" /></div>)}</div>
            <button className="btn"><Icon n="check" size={18} /> ফি সংরক্ষণ করুন</button>
          </form>
        </div>
        <div>
          {prev && <section className="card adm-sec qrbox"><h2>বর্তমান QR</h2><img src={prev} alt="বর্তমান বাংলা QR" style={{ width: 220, maxWidth: '100%' }} /></section>}
          <section className="card adm-sec"><h2>সিস্টেমের অবস্থা</h2>
            {sys.map(([l, ok]) => <div key={l} className="kv"><span>{l}</span><span className={`badge ${ok ? 'ok' : 'bad'}`}>{ok ? 'ঠিক আছে' : 'সেট নেই'}</span></div>)}
            <p className="sub" style={{ margin: '12px 0 0', fontSize: 14 }}>মান বদলাতে হোস্টিংয়ের Environment Variables-এ গিয়ে বদলে নতুন করে ডিপ্লয় করুন।</p>
          </section>
        </div>
      </div>
    </>
  );
}
