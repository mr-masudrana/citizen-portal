import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
test('direct PDF route requires citizen login and application ownership', async () => {
  const src = await read('app/certificate/[no]/pdf/route.js');
  assert.match(src, /currentCitizen\(\)/);
  assert.match(src, /application\.citizen_id !== user\.id/);
  assert.match(src, /application\.status !== 'approved'/);
  assert.match(src, /Cache-Control/);
  assert.match(src, /application\/pdf/);
});
test('PDF route embeds local Bengali regular and bold fonts and QR verification', async () => {
  const src = await read('app/certificate/[no]/pdf/route.js');
  assert.match(src, /NotoSansBengali-Regular\.ttf/);
  assert.match(src, /NotoSansBengali-Bold\.ttf/);
  assert.match(src, /QRCode\.toDataURL/);
  await stat(new URL('../public/fonts/NotoSansBengali-Regular.ttf', import.meta.url));
  await stat(new URL('../public/fonts/NotoSansBengali-Bold.ttf', import.meta.url));
});
test('certificate page and citizen dashboard expose direct PDF download', async () => {
  const page = await read('app/certificate/[no]/page.js');
  const button = await read('app/certificate/[no]/PrintButton.js');
  const dashboard = await read('app/dashboard/page.js');
  assert.match(page, /PrintButton applicationNo/);
  assert.match(button, /\/certificate\/\$\{encodeURIComponent\(applicationNo\)\}\/pdf/);
  assert.match(dashboard, /PDF ডাউনলোড/);
});
test('readiness endpoint reveals no secret values and checks database connectivity', async () => {
  const src = await read('app/api/health/ready/route.js');
  assert.match(src, /checkDatabaseConnection/);
  assert.match(src, /emailProviderConfigured/);
  assert.match(src, /Cache-Control.*no-store/);
  assert.doesNotMatch(src, /SUPABASE_SERVICE_KEY|ADMIN_KEY|RESEND_API_KEY\s*:/);
});
test('email smoke test requires explicit recipient and reports provider acceptance, not delivery', async () => {
  const src = await read('scripts/test-email.mjs');
  assert.match(src, /EMAIL_TEST_TO/);
  assert.match(src, /explicitly requested/);
  assert.match(src, /Check inbox and spam to confirm delivery/);
});
