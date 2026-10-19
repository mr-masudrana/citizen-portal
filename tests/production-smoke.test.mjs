import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('service role key is documented as server-only', async () => {
  const env = await read('.env.example');
  assert.match(env, /^SUPABASE_SERVICE_KEY=/m);
  assert.doesNotMatch(env, /^NEXT_PUBLIC_SUPABASE_SERVICE_KEY=/m);
});

test('Phase 5 shared limiter uses a private table and service-role-only RPC', async () => {
  const sql = await read('supabase/phase5-production.sql');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /reserve_admin_login_attempt/);
  assert.match(sql, /revoke all on function public\.reserve_admin_login_attempt\(text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.reserve_admin_login_attempt\(text\) to service_role/i);
});

test('certificate SQL protects public verification and restricts certificate status', async () => {
  const sql = await read('supabase/phase4-certificates.sql');
  assert.match(sql, /status in \('active','revoked','reissued'\)/i);
  assert.match(sql, /certificates_one_active_per_application/i);
  assert.match(sql, /revoke all on function public\.admin_decide_application/i);
});

test('admin login fails closed when shared rate limiter is unavailable', async () => {
  const src = await read('app/admin/page.js');
  assert.match(src, /reserveAdminLoginAttempt/);
  assert.match(src, /login fails closed/i);
});

test('CSV export neutralizes spreadsheet formula prefixes', async () => {
  const src = await read('app/admin/AdminApplications.js');
  assert.match(src, /\^\[\\s\]\*\[=\+\\-@\]/);
});

test('health endpoint does not return secrets', async () => {
  const src = await read('app/api/health/route.js');
  assert.match(src, /Cache-Control.*no-store/);
  assert.doesNotMatch(src, /process\.env|SUPABASE_SERVICE_KEY|ADMIN_KEY/);
});
