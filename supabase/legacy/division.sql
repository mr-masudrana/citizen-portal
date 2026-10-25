-- বিভাগ ঘরের জন্য: Supabase SQL Editor-এ একবার Run করুন
alter table citizens add column if not exists division text;
alter table applications add column if not exists division text;
