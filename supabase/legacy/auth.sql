-- নাগরিক লগইনের জন্য: Supabase SQL Editor-এ একবার Run করুন (আগের schema.sql চালানো থাকতে হবে)
create table if not exists citizens (
  id uuid primary key default gen_random_uuid(),
  mobile text unique not null,
  pass_hash text not null,
  name text, father text, mother text, dob text, nid text,
  village text, ward text, post text, photo text,
  created_at timestamptz not null default now()
);
alter table citizens enable row level security;
alter table applications add column if not exists citizen_id uuid references citizens(id);
