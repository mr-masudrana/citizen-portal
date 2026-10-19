import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
test('Phase 12 scripts exist and do not print environment values', () => {
  const env = read('scripts/check-env.mjs');
  assert.match(env, /ADMIN_KEY/);
  assert.match(env, /SESSION_SECRET/);
  assert.match(env, /must be at least 32 characters/);
  assert.match(env, /Values are not printed/);
  assert.doesNotMatch(env, /console\.log\([^)]*process\.env\./);
});
test('production smoke test checks HTTPS and readiness', () => {
  const smoke = read('scripts/smoke-production.mjs');
  assert.match(smoke, /https/i);
  assert.match(smoke, /\/api\/health/);
  assert.match(smoke, /\/api\/health\/ready/);
  assert.match(smoke, /503/);
  assert.match(smoke, /SESSION_SECRET/);
});
test('CI workflow runs tests and production build', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
});
test('deployment guide documents backup restore and does not claim automated backups', () => {
  const guide = read('docs/PHASE12-DEPLOYMENT-BACKUP.md');
  assert.match(guide, /Backup and restore/);
  assert.match(guide, /not automated by this repository/i);
  assert.match(guide, /restore/i);
});
