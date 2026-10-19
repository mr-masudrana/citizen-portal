-- Phase 6: named staff accounts and role-based access control.
-- Back up production data before applying. Run after phase3-admin.sql and phase5-production.sql.
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9._-]{3,40}$'),
  password_hash text not null check (length(password_hash) between 150 and 200),
  role text not null check (role in ('admin','reviewer','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_users_active_idx on public.staff_users(active, role);
alter table public.staff_users enable row level security;
-- No anon/authenticated policies. All reads/writes use the server-only service role.
revoke all on public.staff_users from public, anon, authenticated;
grant select, insert, update on public.staff_users to service_role;
