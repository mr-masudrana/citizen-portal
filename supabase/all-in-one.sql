-- নাগরিক সেবা পোর্টাল: সব টেবিল ও ঘর একসঙ্গে। একাধিকবার চালালেও ক্ষতি নেই।
create table if not exists citizens (id uuid primary key default gen_random_uuid(), pass_hash text not null, created_at timestamptz not null default now());
create table if not exists applications (no text primary key, service text not null, name text, status text not null default 'pending', created_at timestamptz not null default now());
create table if not exists settings (id int primary key default 1, union_name text, upazila text, district text);
create table if not exists otps (key text primary key, code_hash text not null, expires_at timestamptz not null, attempts int not null default 0, sent_at timestamptz not null default now(), payload jsonb);

alter table citizens
  add column if not exists mobile text, add column if not exists email text,
  add column if not exists email_verified boolean not null default false, add column if not exists mail_sent_at timestamptz,
  add column if not exists name text, add column if not exists name_bn text,
  add column if not exists father text, add column if not exists father_bn text, add column if not exists father_nid text,
  add column if not exists mother text, add column if not exists mother_bn text, add column if not exists mother_nid text,
  add column if not exists dob text, add column if not exists nid text,
  add column if not exists division text, add column if not exists district text, add column if not exists upazila text, add column if not exists union_name text,
  add column if not exists holding text, add column if not exists village text, add column if not exists ward text, add column if not exists post text, add column if not exists post_code text,
  add column if not exists photo text, add column if not exists blocked boolean not null default false,
  add column if not exists ent_status text, add column if not exists ent_data jsonb, add column if not exists ent_note text, add column if not exists ent_at timestamptz;

alter table applications
  add column if not exists citizen_id uuid references citizens(id), add column if not exists filed_by uuid references citizens(id), add column if not exists consent_at timestamptz,
  add column if not exists name_bn text,
  add column if not exists father text, add column if not exists father_bn text, add column if not exists father_nid text,
  add column if not exists mother text, add column if not exists mother_bn text, add column if not exists mother_nid text,
  add column if not exists dob text, add column if not exists nid text, add column if not exists mobile text,
  add column if not exists division text, add column if not exists district text, add column if not exists upazila text, add column if not exists union_name text,
  add column if not exists holding text, add column if not exists village text, add column if not exists ward text, add column if not exists post text, add column if not exists post_code text,
  add column if not exists photo text, add column if not exists decided_at timestamptz, add column if not exists admin_note text,
  add column if not exists extra jsonb, add column if not exists files jsonb;

alter table citizens alter column mobile drop not null;
alter table applications alter column mobile drop not null;
alter table citizens drop constraint if exists citizens_mobile_key;
create unique index if not exists citizens_email_key on citizens (email);
create index if not exists applications_filed_by_idx on applications (filed_by);

alter table citizens enable row level security;
alter table applications enable row level security;
alter table settings enable row level security;
alter table otps enable row level security;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;
drop table if exists pending_signups;
notify pgrst, 'reload schema';
