create table if not exists applications (
  no text primary key,
  service text not null,
  name text not null,
  father text, mother text, dob text, nid text,
  mobile text not null,
  village text, ward text, post text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  extra jsonb,
  files jsonb
);
-- RLS চালু, কোনো policy নেই: শুধু সার্ভারের service key দিয়ে ডেটা পড়া/লেখা যাবে
alter table applications enable row level security;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 1048576, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];

create index if not exists applications_created_at_idx on applications (created_at desc);
create index if not exists applications_status_created_at_idx on applications (status, created_at desc);
