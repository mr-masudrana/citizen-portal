-- উদ্যোক্তা অ্যাকাউন্টের জন্য: Supabase SQL Editor-এ একবার Run করুন
alter table citizens add column if not exists ent_status text, add column if not exists ent_data jsonb, add column if not exists ent_note text, add column if not exists ent_at timestamptz;
alter table applications add column if not exists filed_by uuid references citizens(id), add column if not exists consent_at timestamptz, add column if not exists photo text;
create index if not exists applications_filed_by_idx on applications (filed_by);
