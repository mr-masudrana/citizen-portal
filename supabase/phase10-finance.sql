-- Phase 10: finance ledger / offline payment reconciliation.
-- This migration does NOT connect a payment gateway or claim online payment success.
-- Run after schema.sql and prior Phase 1-9 migrations.
create table if not exists public.service_fees (
  service text primary key,
  fee_paisa integer not null default 0 check (fee_paisa between 0 and 100000000),
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.application_payments (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique references public.applications(no) on delete restrict,
  citizen_id uuid not null references public.citizens(id) on delete restrict,
  service text not null,
  amount_paisa integer not null check (amount_paisa > 0),
  currency text not null default 'BDT' check (currency = 'BDT'),
  status text not null default 'due' check (status in ('due','submitted','paid','rejected','waived')),
  method text not null default 'offline' check (method in ('offline','sslcommerz','shurjopay','bkash')),
  payer_reference text,
  admin_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payer_reference is null or length(payer_reference) between 3 and 120),
  check (admin_note is null or length(admin_note) <= 500)
);
create index if not exists application_payments_citizen_idx on public.application_payments(citizen_id, created_at desc);
create index if not exists application_payments_status_idx on public.application_payments(status, created_at desc);
alter table public.service_fees enable row level security;
alter table public.application_payments enable row level security;
-- No browser roles have policies. Access goes through server-side service-role code only.

create or replace function public.sync_service_fee_payments(p_service text)
returns integer language plpgsql security definer set search_path = public as $$
declare v_fee integer; v_active boolean; v_count integer;
begin
  select fee_paisa, active into v_fee, v_active from public.service_fees where service = p_service;
  if not found or not v_active or v_fee <= 0 then return 0; end if;
  insert into public.application_payments(application_no, citizen_id, service, amount_paisa)
  select a.no, a.citizen_id, a.service, v_fee
  from public.applications a
  where a.service = p_service and a.citizen_id is not null
    and a.status in ('pending','approved')
    and not exists (select 1 from public.application_payments p where p.application_no = a.no)
  on conflict (application_no) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
revoke all on function public.sync_service_fee_payments(text) from public, anon, authenticated;
grant execute on function public.sync_service_fee_payments(text) to service_role;

create or replace function public.create_application_payment_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_fee integer; v_active boolean;
begin
  if new.citizen_id is null then return new; end if;
  select fee_paisa, active into v_fee, v_active from public.service_fees where service = new.service;
  if found and v_active and v_fee > 0 then
    insert into public.application_payments(application_no, citizen_id, service, amount_paisa)
    values (new.no, new.citizen_id, new.service, v_fee) on conflict (application_no) do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.create_application_payment_after_insert() from public, anon, authenticated;
drop trigger if exists applications_create_payment on public.applications;
create trigger applications_create_payment after insert on public.applications
for each row execute function public.create_application_payment_after_insert();

create or replace function public.citizen_submit_payment_reference(p_application_no text, p_citizen_id uuid, p_reference text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_reference is null or length(trim(p_reference)) < 3 or length(trim(p_reference)) > 120 then return false; end if;
  update public.application_payments set status='submitted', method='offline', payer_reference=left(trim(p_reference),120), submitted_at=now(), admin_note=null, updated_at=now()
  where application_no=p_application_no and citizen_id=p_citizen_id and status in ('due','rejected')
    and exists (select 1 from public.applications a where a.no=p_application_no and a.citizen_id=p_citizen_id and a.status in ('pending','approved'))
  returning id into v_id;
  return v_id is not null;
end; $$;
revoke all on function public.citizen_submit_payment_reference(text,uuid,text) from public, anon, authenticated;
grant execute on function public.citizen_submit_payment_reference(text,uuid,text) to service_role;

create or replace function public.admin_review_application_payment(p_application_no text, p_status text, p_reviewed_by text, p_note text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_status not in ('paid','rejected','waived') then raise exception 'Invalid payment status'; end if;
  if p_status in ('rejected','waived') and (p_note is null or length(trim(p_note)) < 3) then raise exception 'A reason is required'; end if;
  update public.application_payments set status=p_status, reviewed_at=now(), reviewed_by=left(coalesce(p_reviewed_by,'admin'),100), admin_note=left(trim(coalesce(p_note,'')),500), updated_at=now()
  where application_no=p_application_no and ((p_status='waived' and status in ('due','submitted')) or (p_status in ('paid','rejected') and status='submitted')) returning id into v_id;
  return v_id is not null;
end; $$;
revoke all on function public.admin_review_application_payment(text,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_review_application_payment(text,text,text,text) to service_role;

-- No fee amounts are pre-filled: configure official, approved fees in the admin finance panel.
insert into public.service_fees(service, fee_paisa, active) values
('সন্তুষ্টি সনদ',0,false),('নাগরিকত্ব সনদ',0,false),('চারিত্রিক সনদ',0,false),('অবিবাহিত সনদ',0,false),('ওয়ারিশ সনদ',0,false),('পারিবারিক সনদ',0,false),('উত্তরাধিকার সনদ',0,false),('একই নামের প্রত্যয়ন',0,false),('মৃত্যু সনদ',0,false),('জাতীয়তা সনদ',0,false),('না-দাবি প্রত্যয়নপত্র',0,false),('স্থায়ী বাসিন্দা সনদ',0,false),('মাসিক আয়ের সনদ',0,false),('বাৎসরিক আয়ের সনদ',0,false),('ভূমিহীন সনদ',0,false),('বিধবা সনদ',0,false),('সম্প্রদায় সনদ',0,false),('জীবিত প্রত্যয়ন',0,false),('মুক্তিযোদ্ধা প্রত্যয়ন সনদ',0,false),('বিবাহিত সনদ',0,false),('প্রতিবন্ধী সনদ',0,false),('বেকারত্ব সনদ',0,false),('ট্রেড লাইসেন্স',0,false),('পাসপোর্ট সুপারিশপত্র',0,false)
on conflict (service) do nothing;
