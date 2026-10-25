-- নাগরিক সেবা পোর্টাল: সব টেবিল, ঘর ও ফাংশন একসঙ্গে (ওয়ালেট সহ)। একাধিকবার চালালেও ক্ষতি নেই।
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

-- ===== পেমেন্ট ও ওয়ালেট =====
alter table citizens add column if not exists balance int not null default 0;
alter table applications add column if not exists fee int not null default 0, add column if not exists refunded boolean not null default false;
alter table settings add column if not exists pay_name text, add column if not exists pay_note text, add column if not exists qr_payload text,
  add column if not exists qr_image text, add column if not exists qr_dynamic boolean not null default false, add column if not exists fees jsonb;

create table if not exists wallet_tx (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id),
  type text not null, amount int not null, balance_after int not null,
  ref text, note text, created_at timestamptz not null default now()
);
create index if not exists wallet_tx_citizen_idx on wallet_tx (citizen_id, created_at desc);
create table if not exists topups (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id),
  amount int not null check (amount > 0),
  method text not null default 'bangla_qr',
  trx_id text not null, sender text,
  status text not null default 'pending', note text,
  created_at timestamptz not null default now(), decided_at timestamptz
);
-- একই TrxID দুবার ব্যবহার করা যাবে না (বাতিল হওয়া বাদে)
create unique index if not exists topups_trx_uniq on topups (lower(trx_id)) where status <> 'rejected';
alter table wallet_tx enable row level security;
alter table topups enable row level security;

-- ব্যালেন্স বদল সবসময় এই ফাংশনগুলো দিয়ে হয়, তাই একসঙ্গে দুবার খরচ বা ঋণাত্মক ব্যালেন্স হয় না
create or replace function wallet_apply(p_citizen uuid, p_amount int, p_type text, p_ref text, p_note text) returns int language plpgsql as $$
declare nb int;
begin
  update citizens set balance = balance + p_amount where id = p_citizen and balance + p_amount >= 0 returning balance into nb;
  if nb is null then return -1; end if;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (p_citizen, p_type, p_amount, nb, p_ref, p_note);
  return nb;
end $$;

create or replace function topup_approve(p_id uuid, p_note text) returns int language plpgsql as $$
declare t topups%rowtype; nb int;
begin
  update topups set status = 'approved', decided_at = now(), note = p_note where id = p_id and status = 'pending' returning * into t;
  if t.id is null then return -1; end if;
  update citizens set balance = balance + t.amount where id = t.citizen_id returning balance into nb;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (t.citizen_id, 'topup', t.amount, nb, t.trx_id, 'Bangla QR');
  return nb;
end $$;

create or replace function app_refund(p_no text) returns int language plpgsql as $$
declare a applications%rowtype; nb int; payer uuid;
begin
  update applications set refunded = true where no = p_no and refunded = false and fee > 0 returning * into a;
  if a.no is null then return -1; end if;
  payer := coalesce(a.filed_by, a.citizen_id);
  update citizens set balance = balance + a.fee where id = payer returning balance into nb;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (payer, 'refund', a.fee, nb, a.no, a.service);
  return nb;
end $$;

create or replace function app_recharge(p_no text) returns int language plpgsql as $$
declare a applications%rowtype; nb int; payer uuid;
begin
  select * into a from applications where no = p_no and refunded = true and fee > 0 for update;
  if a.no is null then return 0; end if;
  payer := coalesce(a.filed_by, a.citizen_id);
  update citizens set balance = balance - a.fee where id = payer and balance >= a.fee returning balance into nb;
  if nb is null then return -1; end if;
  update applications set refunded = false where no = p_no;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (payer, 'fee', -a.fee, nb, a.no, a.service);
  return nb;
end $$;

-- ===== অ্যাডমিনের সিদ্ধান্ত: অবস্থা বদল ও ফি ফেরত/পুনরায় কাটা একসঙ্গে, একটি লেনদেনে =====
-- ফেরত: 1 সফল, 0 আবেদন নেই বা শর্ত মেলেনি, -1 ফেরত দেওয়া ফি আবার কাটার মতো ব্যালেন্স নেই
create or replace function app_decide(p_no text, p_status text, p_note text, p_only_pending boolean default false) returns int language plpgsql as $$
declare a applications%rowtype; nb int; payer uuid; was_refunded boolean;
begin
  if p_status not in ('approved', 'rejected', 'pending') then return 0; end if;
  select * into a from applications where no = p_no for update;
  if a.no is null then return 0; end if;
  if p_only_pending and a.status <> 'pending' then return 0; end if;
  payer := coalesce(a.filed_by, a.citizen_id);
  was_refunded := a.refunded;
  if p_status = 'rejected' then
    if a.fee > 0 and not a.refunded then
      update citizens set balance = balance + a.fee where id = payer returning balance into nb;
      insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (payer, 'refund', a.fee, nb, a.no, a.service);
      was_refunded := true;
    end if;
  elsif a.fee > 0 and a.refunded then
    update citizens set balance = balance - a.fee where id = payer and balance >= a.fee returning balance into nb;
    if nb is null then return -1; end if;
    insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (payer, 'fee', -a.fee, nb, a.no, a.service);
    was_refunded := false;
  end if;
  update applications set status = p_status, refunded = was_refunded,
    decided_at = case when p_status = 'pending' then null else now() end,
    admin_note = case when p_status = 'pending' then admin_note else p_note end
  where no = p_no;
  return 1;
end $$;

-- ===== ড্যাশবোর্ডের হিসাব (১০০০ সারির সীমা ছাড়া) =====
create or replace function apps_per_day(p_since timestamptz) returns table(day text, n int) language sql stable as $$
  select to_char(created_at at time zone 'Asia/Dhaka', 'YYYY-MM-DD'), count(*)::int from applications where created_at >= p_since group by 1
$$;
create or replace function top_services(p_limit int) returns table(service text, n int) language sql stable as $$
  select service, count(*)::int from applications group by service order by 2 desc limit p_limit
$$;

-- ===== মেয়াদ শেষ OTP ও লগইন-সীমার সারি পরিষ্কার =====
create or replace function cleanup_otps() returns void language sql as $$
  delete from otps where expires_at < now() - interval '1 day'
$$;

notify pgrst, 'reload schema';
