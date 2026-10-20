-- ইমেইল OTP ও প্রোফাইলের নতুন ঘরের জন্য: Supabase SQL Editor-এ একবার Run করুন
create table if not exists otps (
  key text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  sent_at timestamptz not null default now(),
  payload jsonb
);
alter table otps enable row level security;
drop table if exists pending_signups;
alter table citizens add column if not exists name_bn text, add column if not exists father_bn text, add column if not exists mother_bn text, add column if not exists father_nid text, add column if not exists mother_nid text, add column if not exists holding text, add column if not exists post_code text;
alter table applications add column if not exists name_bn text, add column if not exists father_bn text, add column if not exists mother_bn text, add column if not exists father_nid text, add column if not exists mother_nid text, add column if not exists holding text, add column if not exists post_code text;
