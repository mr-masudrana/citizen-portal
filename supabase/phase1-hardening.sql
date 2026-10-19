-- Phase 1 hardening migration. Safe to run more than once.
-- Run in Supabase SQL Editor after schema.sql, auth.sql, and profile-address.sql.

-- Enforce a private bucket even if it was previously created as public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 1048576, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 1048576,
    allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];

-- Keep citizen application history and admin review lists efficient.
create index if not exists applications_created_at_idx
  on public.applications (created_at desc);
create index if not exists applications_status_created_at_idx
  on public.applications (status, created_at desc);
create index if not exists applications_citizen_created_at_idx
  on public.applications (citizen_id, created_at desc);

-- RLS is intentionally enabled without public policies. Server-only service-role access
-- must remain on the server; never add the service key to NEXT_PUBLIC_* variables.
alter table public.applications enable row level security;
alter table public.citizens enable row level security;
alter table public.settings enable row level security;
