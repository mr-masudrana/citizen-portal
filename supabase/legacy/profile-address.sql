-- প্রোফাইলে ঠিকানা (জেলা/উপজেলা/ইউনিয়ন) ও ইউনিয়ন সেটিংসের জন্য: Supabase SQL Editor-এ একবার Run করুন
alter table citizens add column if not exists district text, add column if not exists upazila text, add column if not exists union_name text;
alter table applications add column if not exists district text, add column if not exists upazila text, add column if not exists union_name text;
create table if not exists settings (id int primary key default 1, union_name text, upazila text, district text);
alter table settings enable row level security;
