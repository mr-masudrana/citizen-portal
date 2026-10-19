-- Phase 11: citizen support tickets and public notices.
-- Back up your database and run after phases 1-10 migrations.
create extension if not exists pgcrypto;

create table if not exists citizen_complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_no text unique not null default ('CPH-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12))),
  citizen_id uuid not null references citizens(id) on delete restrict,
  subject text not null check (char_length(subject) between 5 and 160),
  category text not null check (category in ('service','application','staff','technical','other')),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'submitted' check (status in ('submitted','in_review','resolved','rejected')),
  staff_reply text not null default '' check (char_length(staff_reply) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists citizen_complaints_citizen_created_idx on citizen_complaints(citizen_id, created_at desc);
create index if not exists citizen_complaints_status_created_idx on citizen_complaints(status, created_at desc);
alter table citizen_complaints enable row level security;
-- No anon/authenticated policies: app accesses via server-side service key only.

create table if not exists public_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 180),
  body text not null check (char_length(body) between 10 and 10000),
  category text not null default 'general' check (category in ('general','service','urgent','meeting')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or published_at is null or expires_at > published_at)
);
create index if not exists public_notices_published_idx on public_notices(status, published_at desc);
alter table public_notices enable row level security;
-- No public client policy: public notices are served through a server route/page with explicit status filter.
