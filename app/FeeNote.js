import { feeFor } from '../lib/wallet';
import { bn } from '../lib/templates';
import { Icon } from '../lib/icons';
export default async function FeeNote({ service, balance }) {
  const fee = await feeFor(service);
  if (!fee) return <div className="feenote"><Icon n="coins" size={18} /><span>এই সেবার জন্য কোনো ফি নেই।</span></div>;
  const low = balance < fee;
  return (
    <div className={`feenote${low ? ' low' : ''}`}>
      <Icon n="coins" size={18} />
      <span>সেবা ফি <b>৳{bn(fee)}</b> · আপনার ওয়ালেট <b>৳{bn(balance)}</b></span>
      {low ? <a className="btn sm" style={{ margin: 0 }} href={`/wallet/topup?amount=${Math.max(10, fee - balance)}`}>ব্যালেন্স যোগ করুন</a> : <small>আবেদন জমা দিলে কাটা হবে, বাতিল হলে ফেরত পাবেন।</small>}
    </div>
  );
}
