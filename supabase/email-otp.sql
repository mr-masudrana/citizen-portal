-- Supabase SQL Editor-এ একবার চালান। আগে schema.sql ও auth.sql চালানো থাকতে হবে।
-- Existing mobile/password accounts remain in place; new Email OTP accounts use Supabase Auth.
alter table public.citizens alter column pass_hash drop not null;
alter table public.citizens add column if not exists email text;
alter table public.citizens add column if not exists auth_user_id uuid unique;
alter table public.citizens add column if not exists email_verified boolean not null default false;
create unique index if not exists citizens_email_lower_unique on public.citizens (lower(email)) where email is not null;
create index if not exists citizens_auth_user_id_idx on public.citizens (auth_user_id) where auth_user_id is not null;

-- Keep RLS enabled and do not create public policies for these sensitive tables.
alter table public.citizens enable row level security;
alter table public.applications enable row level security;
