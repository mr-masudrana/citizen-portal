-- পেমেন্ট ও ওয়ালেটের জন্য: Supabase SQL Editor-এ একবার Run করুন (আগের সব SQL চালানো থাকতে হবে)
alter table citizens add column if not exists balance int not null default 0;
alter table applications add column if not exists fee int not null default 0, add column if not exists refunded boolean not null default false;
alter table settings add column if not exists pay_name text, add column if not exists pay_note text, add column if not exists qr_payload text,
  add column if not exists qr_image text, add column if not exists qr_dynamic boolean not null default false, add column if not exists fees jsonb;

create table if not exists wallet_tx (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id),
  type text not null, amount int not null, balance_after int not null,
  ref text, note text, created_at timestamptz not null default now()
);
create index if not exists wallet_tx_citizen_idx on wallet_tx (citizen_id, created_at desc);
create table if not exists topups (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id),
  amount int not null check (amount > 0),
  method text not null default 'bangla_qr',
  trx_id text not null, sender text,
  status text not null default 'pending', note text,
  created_at timestamptz not null default now(), decided_at timestamptz
);
-- একই TrxID দুবার ব্যবহার করা যাবে না (বাতিল হওয়া বাদে)
create unique index if not exists topups_trx_uniq on topups (lower(trx_id)) where status <> 'rejected';
alter table wallet_tx enable row level security;
alter table topups enable row level security;

-- ব্যালেন্স বদল সবসময় এই ফাংশনগুলো দিয়ে হয়, তাই একসঙ্গে দুবার খরচ বা ঋণাত্মক ব্যালেন্স হয় না
create or replace function wallet_apply(p_citizen uuid, p_amount int, p_type text, p_ref text, p_note text) returns int language plpgsql as $$
declare nb int;
begin
  update citizens set balance = balance + p_amount where id = p_citizen and balance + p_amount >= 0 returning balance into nb;
  if nb is null then return -1; end if;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (p_citizen, p_type, p_amount, nb, p_ref, p_note);
  return nb;
end $$;

create or replace function topup_approve(p_id uuid, p_note text) returns int language plpgsql as $$
declare t topups%rowtype; nb int;
begin
  update topups set status = 'approved', decided_at = now(), note = p_note where id = p_id and status = 'pending' returning * into t;
  if t.id is null then return -1; end if;
  update citizens set balance = balance + t.amount where id = t.citizen_id returning balance into nb;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (t.citizen_id, 'topup', t.amount, nb, t.trx_id, 'Bangla QR');
  return nb;
end $$;

create or replace function app_refund(p_no text) returns int language plpgsql as $$
declare a applications%rowtype; nb int; payer uuid;
begin
  update applications set refunded = true where no = p_no and refunded = false and fee > 0 returning * into a;
  if a.no is null then return -1; end if;
  payer := coalesce(a.filed_by, a.citizen_id);
  update citizens set balance = balance + a.fee where id = payer returning balance into nb;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (payer, 'refund', a.fee, nb, a.no, a.service);
  return nb;
end $$;

create or replace function app_recharge(p_no text) returns int language plpgsql as $$
declare a applications%rowtype; nb int; payer uuid;
begin
  select * into a from applications where no = p_no and refunded = true and fee > 0 for update;
  if a.no is null then return 0; end if;
  payer := coalesce(a.filed_by, a.citizen_id);
  update citizens set balance = balance - a.fee where id = payer and balance >= a.fee returning balance into nb;
  if nb is null then return -1; end if;
  update applications set refunded = false where no = p_no;
  insert into wallet_tx (citizen_id, type, amount, balance_after, ref, note) values (payer, 'fee', -a.fee, nb, a.no, a.service);
  return nb;
end $$;
notify pgrst, 'reload schema';
