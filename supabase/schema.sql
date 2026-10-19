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
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;
