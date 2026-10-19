import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('staff role is revalidated against active database account on every request', async () => {
  const src = await read('app/admin/page.js');
  assert.match(src, /const currentRole = async/);
  assert.match(src, /getStaffById\(staffId\)/);
  assert.match(src, /staff\.active && staff\.role === role/);
  assert.match(src, /access denied/i);
});

test('viewer role does not fetch application records, documents, certificate list, or audit logs', async () => {
  const src = await read('app/admin/page.js');
  assert.match(src, /const mayReviewApplications = \['super_admin','admin','reviewer'\]\.includes\(role\)/);
  assert.match(src, /const rows = mayReviewApplications \? await all\(\) : \[\]/);
  assert.match(src, /if \(mayManage\) \{ try \{ logs = await recentAuditLogs/);
  assert.match(src, /if \(mayManage\) \{ try \{ certificates = await certificatesForApplications/);
});

test('security headers include anti-framing, MIME sniffing, and referrer controls', async () => {
  const src = await read('next.config.js');
  assert.match(src, /X-Frame-Options.*DENY/);
  assert.match(src, /X-Content-Type-Options.*nosniff/);
  assert.match(src, /Referrer-Policy.*strict-origin-when-cross-origin/);
  assert.match(src, /Strict-Transport-Security/);
});

test('certificate PDF endpoint verifies owner, approved state, and active certificate', async () => {
  const src = await read('app/certificate/[no]/pdf/route.js');
  assert.match(src, /application\.citizen_id !== user\.id/);
  assert.match(src, /application\.status !== 'approved'/);
  assert.match(src, /getActiveCertificateForApplication/);
  assert.match(src, /Cache-Control.*no-store/);
});

test('Supabase service role key remains server-only', async () => {
  const env = await read('.env.example');
  assert.match(env, /^SUPABASE_SERVICE_KEY=/m);
  assert.doesNotMatch(env, /^NEXT_PUBLIC_SUPABASE_SERVICE_KEY=/m);
});
