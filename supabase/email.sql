-- ইমেইল লগইনের জন্য: Supabase SQL Editor-এ একবার Run করুন
alter table citizens add column if not exists email text, add column if not exists email_verified boolean not null default false, add column if not exists mail_sent_at timestamptz;
create unique index if not exists citizens_email_key on citizens (email);
