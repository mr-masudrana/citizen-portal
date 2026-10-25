-- অ্যাডমিন প্যানেলের জন্য: Supabase SQL Editor-এ একবার Run করুন
alter table applications add column if not exists admin_note text;
alter table citizens add column if not exists blocked boolean not null default false;
