-- ইমেইল নিশ্চিত করার পরই অ্যাকাউন্ট তৈরি, আর মোবাইল নম্বর ঐচ্ছিক: Supabase SQL Editor-এ একবার Run করুন
create table if not exists pending_signups (
  email text primary key,
  name text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  sent_at timestamptz not null default now()
);
alter table pending_signups enable row level security;
alter table citizens alter column mobile drop not null;
alter table applications alter column mobile drop not null;
alter table citizens drop constraint if exists citizens_mobile_key;
