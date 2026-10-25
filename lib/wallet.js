import { getSettings, rpc, add, removeDocs } from './db';
// সেবার ফি অ্যাডমিন সেটিংসে ঠিক করেন। না দিলে ০ (বিনামূল্যে)।
export async function feeFor(service) { const s = await getSettings(); return Number(s.fees?.[service]) || 0; }
// ওয়ালেট থেকে ফি কাটে (একসঙ্গে দুবার খরচ বা ঋণাত্মক ব্যালেন্স ডেটাবেজই আটকায়)। কাটা গেলে true।
export async function charge(payer, fee, no, service) {
  return (await rpc('wallet_apply', { p_citizen: payer, p_amount: -fee, p_type: 'fee', p_ref: no, p_note: service })) !== -1;
}
// আবেদন জমা: আগে ফি কাটা (ডেটাবেজে অ্যাটমিক), তারপর ফাইল আপলোড ও আবেদন সংরক্ষণ।
// মাঝপথে কিছু ব্যর্থ হলে আপলোড হওয়া ফাইল মুছে ফি ফেরত দিয়ে ত্রুটি আবার ছুড়ে দেয়। ফেরত: 'ok' | 'bal'
// (redirect() এখানে ডাকা যাবে না, ডাকলে ত্রুটি হিসেবে ধরা পড়বে। ফলাফল দেখে কলার redirect করবে।)
export async function placeApplication({ payer, fee, no, service, upload, row }) {
  if (fee && !(await charge(payer, fee, no, service))) return 'bal';
  const bag = [];
  try {
    const up = await upload(bag);
    await add({ ...row, ...up, fee, no, service });
    return 'ok';
  } catch (e) {
    await removeDocs(bag);
    if (fee) { try { await rpc('wallet_apply', { p_citizen: payer, p_amount: fee, p_type: 'refund', p_ref: no, p_note: service }); } catch (e2) { console.error('ফি ফেরত দেওয়া যায়নি, হাতে মিলিয়ে দিন:', no, e2.message); } }
    throw e;
  }
}
