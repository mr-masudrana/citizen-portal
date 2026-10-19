-- Phase 5 production hardening. Run after schema.sql and other documented migrations.
-- Back up the database before applying in production.

create table if not exists public.admin_login_attempts (
  ip_hash text primary key check (ip_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.admin_login_attempts enable row level security;
-- No anon/authenticated policies: only the server-side service role can access this table.

create or replace function public.reserve_admin_login_attempt(p_ip_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer; v_started timestamptz;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  insert into public.admin_login_attempts(ip_hash, window_started_at, attempt_count, updated_at)
    values (p_ip_hash, now(), 1, now())
    on conflict (ip_hash) do update set
      window_started_at = case when public.admin_login_attempts.window_started_at < now() - interval '15 minutes' then now() else public.admin_login_attempts.window_started_at end,
      attempt_count = case when public.admin_login_attempts.window_started_at < now() - interval '15 minutes' then 1 else public.admin_login_attempts.attempt_count + 1 end,
      updated_at = now()
    returning attempt_count, window_started_at into v_count, v_started;
  return v_started >= now() - interval '15 minutes' and v_count <= 5;
end; $$;

create or replace function public.clear_admin_login_attempts(p_ip_hash text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_ip_hash is not null and p_ip_hash ~ '^[a-f0-9]{64}$' then
    delete from public.admin_login_attempts where ip_hash = p_ip_hash;
  end if;
end; $$;

revoke all on function public.reserve_admin_login_attempt(text) from public, anon, authenticated;
revoke all on function public.clear_admin_login_attempts(text) from public, anon, authenticated;
grant execute on function public.reserve_admin_login_attempt(text) to service_role;
grant execute on function public.clear_admin_login_attempts(text) to service_role;

-- Operational note: monitor/clean old rows periodically; never expose the service-role key.
