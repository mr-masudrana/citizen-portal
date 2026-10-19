-- Phase 4: run after schema.sql, auth.sql, email-otp.sql and phase3-admin.sql.
-- Certificate public verification intentionally exposes only certificate type, holder name, issue date and issuing office.
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  application_no text not null references public.applications(no) on delete restrict,
  certificate_no text not null unique check (certificate_no ~ '^CP-[A-Z0-9]{10}$'),
  status text not null default 'active' check (status in ('active','revoked','reissued')),
  issued_at timestamptz not null default now(),
  issued_by text not null default 'admin',
  revoked_at timestamptz,
  revocation_reason text,
  replaced_by text,
  created_at timestamptz not null default now()
);
create index if not exists certificates_application_idx on public.certificates(application_no, created_at desc);
create index if not exists certificates_status_idx on public.certificates(status, issued_at desc);
create unique index if not exists certificates_one_active_per_application on public.certificates(application_no) where status = 'active';
alter table public.certificates enable row level security;
-- no public policies; access through server-only service role.

-- Backfill approved applications that predate Phase 4.
insert into public.certificates(application_no, certificate_no, status, issued_at)
select a.no, 'CP-' || upper(substr(md5(a.no), 1, 10)), 'active', coalesce(a.decided_at, a.created_at, now())
from public.applications a
where a.status = 'approved'
  and not exists (select 1 from public.certificates c where c.application_no = a.no and c.status = 'active')
on conflict (certificate_no) do nothing;

create or replace function public.admin_decide_application(
  p_no text, p_status text, p_decided_at timestamptz, p_certificate_no text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_no text;
begin
  if p_status not in ('approved','rejected') then raise exception 'Invalid status'; end if;
  update public.applications set status = p_status, decided_at = p_decided_at
  where no = p_no and status = 'pending' returning no into v_no;
  if v_no is null then return false; end if;
  if p_status = 'approved' then
    insert into public.certificates(application_no, certificate_no, status, issued_at)
    values (p_no, p_certificate_no, 'active', p_decided_at);
  end if;
  return true;
end; $$;
revoke all on function public.admin_decide_application(text,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.admin_decide_application(text,text,timestamptz,text) to service_role;

create or replace function public.admin_revoke_certificate(p_certificate_no text, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.certificates set status='revoked', revoked_at=now(), revocation_reason=left(trim(p_reason),500)
  where certificate_no=p_certificate_no and status='active' returning id into v_id;
  return v_id is not null;
end; $$;
revoke all on function public.admin_revoke_certificate(text,text) from public, anon, authenticated;
grant execute on function public.admin_revoke_certificate(text,text) to service_role;

create or replace function public.admin_reissue_certificate(p_old_no text, p_new_no text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_app text; v_id uuid;
begin
  update public.certificates set status='reissued', replaced_by=p_new_no
  where certificate_no=p_old_no and status='active' returning application_no, id into v_app, v_id;
  if v_id is null then return false; end if;
  insert into public.certificates(application_no, certificate_no, status, issued_at)
  values(v_app, p_new_no, 'active', now());
  return true;
exception when unique_violation then
  raise exception 'Certificate number collision or active certificate already exists';
end; $$;
revoke all on function public.admin_reissue_certificate(text,text) from public, anon, authenticated;
grant execute on function public.admin_reissue_certificate(text,text) to service_role;
