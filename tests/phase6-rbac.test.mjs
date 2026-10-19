import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
test('RBAC migration restricts roles and enables RLS', () => {
  const sql = read('supabase/phase6-staff-rbac.sql');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /'admin','reviewer','viewer'/);
  assert.match(sql, /revoke all on public\.staff_users from public, anon, authenticated/i);
});
test('admin actions check roles server-side', () => {
  const source = read('app/admin/page.js');
  assert.match(source, /if \(!\(await can\(\['super_admin','admin','reviewer'\]\)\)\) return/);
  assert.match(source, /if \(!\(await can\(\['super_admin'\]\)\)\) return/);
  assert.match(source, /admin_role/);
  assert.match(source, /verifyPassword\(password, staff\.password_hash\)/);
});
