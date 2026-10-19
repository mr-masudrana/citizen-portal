import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
test('Phase 7 migration restricts notifications to server-side service role', () => {
 const sql = read('supabase/phase7-notifications-password.sql');
 assert.match(sql, /enable row level security/i);
 assert.match(sql, /revoke all on public\.citizen_notifications from public, anon, authenticated/i);
});
test('staff password changes verify current password and invalidate session', () => {
 const src = read('app/admin/page.js');
 assert.match(src, /verifyPassword\(oldPassword, staff\.password_hash\)/);
 assert.match(src, /staff_password_changed/);
 assert.match(src, /confirm_password/);
});
test('application decisions create in-app notification and optional email', () => {
 const src = read('app/admin/page.js');
 assert.match(src, /createCitizenNotification/);
 assert.match(src, /sendTransactionalEmail/);
});
test('email delivery is optional and does not require a package dependency', () => {
 const src = read('lib/email.js');
 assert.match(src, /RESEND_API_KEY/);
 assert.match(src, /email_not_configured/);
});
