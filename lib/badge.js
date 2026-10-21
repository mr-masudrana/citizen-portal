import { Icon } from './icons';
// অ্যাকাউন্টের ধরনের ব্যাজ: নাগরিক / উদ্যোক্তা / উদ্যোক্তা আবেদন বিবেচনাধীন
export function AccountBadge({ u, center = true }) {
  if (u.ent_status === 'approved') return <span className="acct ent"><Icon n="briefcase" size={14} /> উদ্যোক্তা{center && u.ent_data?.center ? ` · ${u.ent_data.center}` : ''}</span>;
  return (
    <>
      <span className="acct cit"><Icon n="user" size={14} /> নাগরিক</span>
      {u.ent_status === 'pending' && <span className="acct wait">উদ্যোক্তা আবেদন বিবেচনাধীন</span>}
    </>
  );
}
