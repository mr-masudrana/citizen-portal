import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
test('Phase 11 migration creates complaint and notice tables with RLS and constrained statuses', () => {
 const sql = read('../supabase/phase11-support-notices.sql');
 assert.match(sql, /create table if not exists citizen_complaints/i);
 assert.match(sql, /alter table citizen_complaints enable row level security/i);
 assert.match(sql, /create table if not exists public_notices/i);
 assert.match(sql, /alter table public_notices enable row level security/i);
 assert.match(sql, /'submitted','in_review','resolved','rejected'/i);
 assert.match(sql, /'draft','published','archived'/i);
});
test('citizen complaint actions require authenticated citizen and validate lengths', () => {
 const page = read('../app/support/page.js');
 assert.match(page, /requireCitizen\('\/support'\)/);
 assert.match(page, /subject\.length < 5/);
 assert.match(page, /message\.length > 5000/);
});
test('admin complaint and notice mutations enforce role authorization server-side', () => {
 const page = read('../app/admin/support/page.js');
 assert.match(page, /updateComplaintAction[\s\S]*?\['super_admin','admin','reviewer'\]/);
 assert.match(page, /createNoticeAction[\s\S]*?\['super_admin','admin'\]/);
 assert.match(page, /archiveNoticeAction[\s\S]*?\['super_admin','admin'\]/);
});
test('public notices only return published and unexpired notices', () => {
 const db = read('../lib/db.js');
 assert.match(db, /publishedNotices[\s\S]*?\.eq\('status', 'published'\)/);
 assert.match(db, /expires_at.*Date\.now\(\)/);
});
test('phase 11 support routes and migration are present', () => {
 assert.ok(existsSync(new URL('../app/support/page.js', import.meta.url)));
 assert.ok(existsSync(new URL('../app/notices/page.js', import.meta.url)));
 assert.ok(existsSync(new URL('../app/admin/support/page.js', import.meta.url)));
 assert.ok(existsSync(new URL('../supabase/phase11-support-notices.sql', import.meta.url)));
});
