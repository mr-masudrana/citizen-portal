-- Phase 7: citizen notifications and staff password change support.
-- Back up first. Run after phase6-staff-rbac.sql.
create table if not exists public.citizen_notifications (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  application_no text references public.applications(no) on delete set null,
  title text not null check (length(title) between 1 and 160),
  message text not null check (length(message) between 1 and 1000),
  kind text not null default 'info' check (kind in ('info','success','warning','error')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists citizen_notifications_owner_created_idx
  on public.citizen_notifications(citizen_id, created_at desc);
alter table public.citizen_notifications enable row level security;
revoke all on public.citizen_notifications from public, anon, authenticated;
grant select, insert, update, delete on public.citizen_notifications to service_role;
-- Staff password updates use the existing server-only service-role DB client.
