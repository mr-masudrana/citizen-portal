import { redirect } from 'next/navigation';
import { requireCitizen, ready } from '../../../lib/auth';
import { patchCitizen, uploadDocs, badFile } from '../../../lib/db';
import { Icon } from '../../../lib/icons';
export const dynamic = 'force-dynamic';
async function join(fd) {
  'use server';
  const u = await requireCitizen('/ent/join');
  if (!ready(u)) redirect('/profile?need=1');
  if (['pending', 'approved', 'revoked'].includes(u.ent_status)) redirect('/ent/join');
  const g = (k, n = 120) => String(fd.get(k) || '').trim().slice(0, n);
  const center = g('center'), address = g('address', 200), license = g('license'), reason = g('reason', 500);
  const files = fd.getAll('docs').filter((f) => f.size > 0);
  if (!center || !address || !files.length) redirect('/ent/join?error=1');
  if (badFile(files)) redirect('/ent/join?error=file');
  if (!fd.get('terms')) redirect('/ent/join?error=terms');
  const paths = await uploadDocs(`ent_${u.id}_${Date.now()}`, files);
  await patchCitizen(u.id, { ent_status: 'pending', ent_data: { center, address, license, reason, files: paths }, ent_note: null, ent_at: new Date().toISOString() });
  redirect('/ent/join?sent=1');
}
export default async function Join({ searchParams: sp }) {
  const u = await requireCitizen('/ent/join');
  const st = u.ent_status;
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <h1>উদ্যোক্তা অ্যাকাউন্ট</h1>
      <p className="sub">উদ্যোক্তা অন্যের নাম ঠিকানা দিয়ে তাঁদের হয়ে সনদের আবেদন করতে পারেন। অ্যাডমিন অনুমতি দিলে এই সুবিধা চালু হবে।</p>
      {sp.sent && <p className="badge ok">আবেদন জমা হয়েছে। অ্যাডমিনের সিদ্ধান্ত ইমেইলে জানানো হবে।</p>}
      {sp.error === '1' && <p className="badge bad">প্রতিষ্ঠানের নাম, ঠিকানা ও অন্তত একটি নথি দিন।</p>}
      {sp.error === 'file' && <p className="badge bad">ফাইল সর্বোচ্চ ৩টি, প্রতিটি ১ MB-এর মধ্যে এবং JPG, PNG বা PDF হতে হবে।</p>}
      {sp.error === 'terms' && <p className="badge bad">শর্তে সম্মতির ঘরে টিক দিন।</p>}
      {st === 'approved' && <div className="card"><span className="badge ok">আপনি অনুমোদিত উদ্যোক্তা</span><br /><a className="btn" href="/ent"><Icon n="briefcase" size={18} /> উদ্যোক্তা প্যানেলে যান</a></div>}
      {st === 'pending' && <div className="card"><span className="badge warn">আবেদন বিবেচনাধীন</span><p className="sub" style={{ margin: '10px 0 0' }}>অ্যাডমিন আপনার আবেদন যাচাই করছেন। সিদ্ধান্ত ইমেইলে জানানো হবে।</p></div>}
      {st === 'revoked' && <div className="card"><span className="badge bad">অনুমতি প্রত্যাহার করা হয়েছে</span>{u.ent_note && <p style={{ margin: '10px 0 0' }}><b>কারণ:</b> {u.ent_note}</p>}<p className="sub" style={{ margin: '10px 0 0' }}>বিস্তারিত জানতে ইউনিয়ন পরিষদের সঙ্গে যোগাযোগ করুন।</p></div>}
      {(!st || st === 'rejected') && (
        <>
          {st === 'rejected' && <div className="card" style={{ marginBottom: 16 }}><span className="badge bad">আগের আবেদন বাতিল হয়েছে</span>{u.ent_note && <p style={{ margin: '10px 0 0' }}><b>কারণ:</b> {u.ent_note}</p>}<p className="sub" style={{ margin: '8px 0 0' }}>তথ্য ঠিক করে নিচে আবার আবেদন করতে পারেন।</p></div>}
          <form className="card" action={join}>
            <label htmlFor="center" style={{ marginTop: 0 }}>প্রতিষ্ঠান / ডিজিটাল সেন্টারের নাম <span className="req">*</span></label><input id="center" name="center" required />
            <label htmlFor="address">প্রতিষ্ঠানের ঠিকানা <span className="req">*</span></label><input id="address" name="address" required />
            <label htmlFor="license">ট্রেড লাইসেন্স বা পরিচয় নম্বর (থাকলে)</label><input id="license" name="license" />
            <label htmlFor="reason">অভিজ্ঞতা বা আবেদনের কারণ (ঐচ্ছিক)</label><textarea id="reason" name="reason" rows={3} maxLength={500} />
            <label htmlFor="docs">ট্রেড লাইসেন্স বা পরিচয়ের নথি <span className="req">*</span> (সর্বোচ্চ ৩টি, প্রতিটি ১ MB; JPG, PNG, PDF)</label>
            <input id="docs" name="docs" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" required />
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400, marginTop: 18 }}><input type="checkbox" name="terms" style={{ width: 'auto', marginTop: 5 }} />
              <span>আমি জানি, অন্যের হয়ে আবেদনে দেওয়া তথ্য সঠিক এবং আবেদনকারীর সম্মতিক্রমে দেওয়ার দায় আমার। ভুয়া বা ভুল তথ্য দিলে আমার অনুমতি বাতিল হতে পারে।</span></label>
            <button className="btn"><Icon n="check" size={18} /> উদ্যোক্তা হতে আবেদন করুন</button>
          </form>
        </>
      )}
    </div>
  );
}
