import { getSettings, rpc } from './db';
// সেবার ফি অ্যাডমিন সেটিংসে ঠিক করেন। না দিলে ০ (বিনামূল্যে)।
export async function feeFor(service) { const s = await getSettings(); return Number(s.fees?.[service]) || 0; }
// ওয়ালেট থেকে ফি কাটে (একসঙ্গে দুবার খরচ বা ঋণাত্মক ব্যালেন্স ডেটাবেজই আটকায়)। কাটা গেলে true।
export async function charge(payer, fee, no, service) {
  return (await rpc('wallet_apply', { p_citizen: payer, p_amount: -fee, p_type: 'fee', p_ref: no, p_note: service })) !== -1;
}
