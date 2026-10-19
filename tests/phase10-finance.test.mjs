import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('finance migration enables RLS and grants no browser policies', () => {
  const sql = read('../supabase/phase10-finance.sql');
  assert.match(sql, /alter table public\.service_fees enable row level security/i);
  assert.match(sql, /alter table public\.application_payments enable row level security/i);
  assert.match(sql, /revoke all on function public\.citizen_submit_payment_reference[\s\S]*?from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.citizen_submit_payment_reference[\s\S]*?to service_role/i);
});

test('fee amounts are not invented or activated by default', () => {
  const sql = read('../supabase/phase10-finance.sql');
  assert.match(sql, /values\s*\([^;]*?0,false/s);
  assert.match(sql, /No fee amounts are pre-filled/i);
});

test('payment reference submission is tied to citizen and application and cannot mark paid', () => {
  const sql = read('../supabase/phase10-finance.sql');
  assert.match(sql, /where application_no=p_application_no and citizen_id=p_citizen_id and status in \('due','rejected'\)/i);
  assert.match(sql, /set status='submitted'/i);
  assert.doesNotMatch(sql, /citizen_submit_payment_reference[\s\S]{0,1200}set status='paid'/i);
});

test('payment review only transitions allowed states and requires reasons for rejection/waiver', () => {
  const sql = read('../supabase/phase10-finance.sql');
  assert.match(sql, /p_status not in \('paid','rejected','waived'\)/i);
  assert.match(sql, /p_status in \('rejected','waived'\) and \(p_note is null or length\(trim\(p_note\)\) < 3\)/i);
  assert.match(sql, /p_status in \('paid','rejected'\) and status='submitted'/i);
});

test('admin finance actions check role on the server', () => {
  const admin = read('../app/admin/page.js');
  assert.match(admin, /async function updateServiceFee\(fd\)[\s\S]*?can\(\['super_admin','admin'\]\)/);
  assert.match(admin, /async function decidePayment\(fd\)[\s\S]*?can\(\['super_admin','admin'\]\)/);
});

test('citizen payment submission checks application ownership before recording reference', () => {
  const dashboard = read('../app/dashboard/page.js');
  assert.match(dashboard, /const app = await get\(no\)/);
  assert.match(dashboard, /app\.citizen_id !== u\.id/);
  assert.match(dashboard, /submitCitizenPaymentReference\(no, u\.id, reference\)/);
});

test('finance UI clearly discloses that no online gateway is connected', () => {
  const admin = read('../app/admin/page.js');
  const dashboard = read('../app/dashboard/page.js');
  assert.match(admin, /কোনো পেমেন্ট গেটওয়ে সংযুক্ত নয়/);
  assert.match(dashboard, /কোনো অনলাইন পেমেন্ট গেটওয়ে সংযুক্ত নেই/);
});

test('finance migration and README are present', () => {
  assert.ok(existsSync(new URL('../supabase/phase10-finance.sql', import.meta.url)));
  assert.ok(existsSync(new URL('../README-PHASE10.md', import.meta.url)));
});

test('payment reference requires application ownership and an eligible application status in SQL', () => {
  const sql = read('../supabase/phase10-finance.sql');
  assert.match(sql, /a\.no=p_application_no and a\.citizen_id=p_citizen_id and a\.status in \('pending','approved'\)/i);
});

test('admin cannot activate a zero-taka service fee', () => {
  const admin = read('../app/admin/page.js');
  assert.match(admin, /active && fee_paisa === 0/);
});
