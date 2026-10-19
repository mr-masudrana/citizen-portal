# নাগরিক সেবা পোর্টাল (Next.js 14 + Supabase)

## প্রথমবার সেটআপ
1. https://supabase.com এ একটি প্রজেক্ট খুলুন।
2. Dashboard > SQL Editor-এ `supabase/schema.sql` ফাইলের লেখা পেস্ট করে Run দিন (টেবিল ও গোপন `documents` বাকেট তৈরি হবে)।
3. Project Settings > API থেকে Project URL এবং `service_role` key নিন।
4. `.env.example` কপি করে `.env.local` নাম দিন এবং মান বসান। `service_role` key শুধু সার্ভারে থাকবে, কোথাও প্রকাশ করবেন না।
5. `npm install` তারপর `npm run dev` → http://localhost:3000

## পেজ
- `/` হোম, `/apply` সাধারণ আবেদন, `/warish` ওয়ারিশ সনদের আবেদন
- `/track` অবস্থা, `/verify` সনদ যাচাই
- `/admin` কর্মকর্তার অনুমোদন ও নথি দেখা (ADMIN_KEY দিয়ে প্রবেশ)
- `/certificate/[নম্বর]?mobile=...` সনদ প্রিন্ট

## জেনে রাখুন
- ফাইল: সর্বোচ্চ ৩টি, প্রতিটি ১ MB, JPG/PNG/PDF। নথি গোপন বাকেটে থাকে, কর্মকর্তা ১০ মিনিটের অস্থায়ী লিংকে দেখেন।
- Vercel-এ ডিপ্লয় করলে একই env মানগুলো Project Settings > Environment Variables-এ দিন। Vercel-এ রিকোয়েস্টের সীমা ৪.৫ MB।
- সনদের ভাষা সাধারণ। আপনার ইউনিয়ন পরিষদের অনুমোদিত ফরম্যাট বসাতে হবে।
- এখনো নেই: পেমেন্ট, ইউনিয়ন নিবন্ধন, SMS OTP এবং একাধিক কর্মকর্তা-ভিত্তিক RBAC।

## নাগরিক লগইন ও প্রোফাইল
- Supabase SQL Editor-এ `supabase/auth.sql` একবার Run করুন (`citizens` টেবিল ও `applications.citizen_id`)।
- `.env.local`-এ `SESSION_SECRET` দিন। তৈরির কমান্ড: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `/register` নিবন্ধন, `/login` লগইন, `/profile` প্রোফাইল, `/dashboard` আমার আবেদন।
- প্রোফাইল ১০০% (নাম, মোবাইল, পিতা, মাতা, জন্ম তারিখ, NID, গ্রাম, ওয়ার্ড, ডাকঘর, ছবি) না হলে `/apply` ও `/warish` খুলবে না।
- পুরোনো মোবাইল/পাসওয়ার্ড অ্যাকাউন্টে পাসওয়ার্ড `scrypt` দিয়ে হ্যাশ করা থাকে। নতুন অ্যাকাউন্টে Supabase Auth Email OTP ব্যবহৃত হয়; পুরোনো অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে Supabase Auth-এ রূপান্তরিত হয় না।

## ঠিকানা ও ইউনিয়ন তথ্য (env লাগবে না)
- Supabase SQL Editor-এ `supabase/profile-address.sql` একবার Run করুন।
- নাগরিক নিজের জেলা, উপজেলা, ইউনিয়ন, গ্রাম, ওয়ার্ড ও ডাকঘর `/profile` থেকে দেন। এই ঠিকানা সনদের মূল লেখায় ছাপা হয়।
- সনদের শিরোনামের ইউনিয়ন পরিষদের নাম, উপজেলা ও জেলা কর্মকর্তা `/admin` পেজের "ইউনিয়ন পরিষদের তথ্য" ফর্ম থেকে বদলান।
- প্রোফাইলে ৩টি নতুন ঘর (জেলা, উপজেলা, ইউনিয়ন) যোগ হওয়ায় আগের নাগরিকদের সম্পূর্ণতা ১০০%-এর নিচে নামবে, তাঁরা এগুলো পূরণ করলে আবার ১০০% হবে।


## নিরাপত্তা ও ডিপ্লয়মেন্ট চেকলিস্ট
- `ADMIN_KEY` অন্তত ৩২ অক্ষরের এলোমেলো গোপন মান দিন; `SESSION_SECRET`-ও আলাদা ও দীর্ঘ রাখুন।
- `SUPABASE_SERVICE_KEY` কখনো `NEXT_PUBLIC_` ভেরিয়েবলে রাখবেন না, GitHub-এ commit করবেন না এবং browser code-এ ব্যবহার করবেন না।
- Supabase-এ `schema.sql`, তারপর `auth.sql`, তারপর `profile-address.sql` চালান। বিদ্যমান ডেটাবেজে SQL চালানোর আগে backup নিন।
- `documents` bucket private রাখুন। Production-এ ব্যবহার করার আগে অনুমোদিত সনদের ভাষা ও পরিচয় যাচাই প্রক্রিয়া সংশ্লিষ্ট কর্তৃপক্ষের মাধ্যমে নিশ্চিত করুন।
- SMS OTP নেই। অ্যাডমিন লগইনের process-local throttling স্থায়ী shared rate limiting-এর বিকল্প নয়। Production-এর আগে automated test suite এবং shared rate limiter যোগ করুন।


## প্রস্তাবিত পরবর্তী ফিচার (Roadmap)
1. SMS OTP দিয়ে মোবাইল যাচাই এবং পাসওয়ার্ড রিসেট।
2. কর্মকর্তা/সুপার-অ্যাডমিন/রিভিউয়ার আলাদা ভূমিকা ও অনুমতি (RBAC)।
3. আবেদন ইতিহাস, কর্মকর্তার মন্তব্য, সংশোধনের জন্য ফেরত পাঠানো এবং পুনরায় জমা।
4. প্রতিটি অনুমোদন/বাতিল/সেটিং পরিবর্তনের audit log।
5. স্থায়ী rate limiting, CAPTCHA/anti-bot এবং login alert।
6. আবেদন ও সনদ PDF ডাউনলোড, সনদ বাতিল/পুনঃইস্যু এবং QR যাচাইয়ের ন্যূনতম তথ্য প্রকাশ।
7. SMS/ইমেইল নোটিফিকেশন, আবেদন ফি ও অনলাইন পেমেন্ট (অনুমোদিত গেটওয়ে থাকলে)।
8. কর্মকর্তা ড্যাশবোর্ডে তারিখ/সেবা/অবস্থা ফিল্টার, সার্চ, CSV/PDF রিপোর্ট।
9. বাংলা/ইংরেজি ভাষা, অ্যাক্সেসিবিলিটি, মোবাইল নেটওয়ার্কে কম ডেটা ব্যবহারের PWA।
10. স্বয়ংক্রিয় পরীক্ষা, error monitoring, backup/restore ও retention policy।

ফিচারগুলো অগ্রাধিকারে যোগ করার পরামর্শ: (১) নিরাপত্তা ও OTP, (২) audit log ও ভূমিকা-ভিত্তিক অনুমতি, (৩) আবেদন সংশোধন/নোটিফিকেশন, (৪) রিপোর্ট ও পেমেন্ট। সরকারি সনদ ইস্যুর আগে ইউনিয়ন পরিষদের অনুমোদিত সনদ-ফরম্যাট, ফি ও পরিচয় যাচাই প্রক্রিয়া নিশ্চিত করুন।

## Phase 1 — stability and security hardening
- নাগরিক সেশনের signature যাচাই, মেয়াদ ও token format যাচাই আরও কঠোর করা হয়েছে। `SESSION_SECRET` কমপক্ষে ৩২ অক্ষরের হতে হবে।
- অ্যাডমিন সেশন এখন timestamp + random nonce + HMAC signature ব্যবহার করে; server-side expiry-ও যাচাই হয়। `ADMIN_KEY` কমপক্ষে ৩২ অক্ষরের হতে হবে।
- অ্যাডমিন লগইনে process-local best-effort throttling যোগ হয়েছে। **এটি স্থায়ী/শেয়ার্ড rate limiter নয়**; Vercel/serverless production-এ Upstash Redis বা সমমানের shared store দিয়ে প্রতিস্থাপন করতে হবে।
- malformed password hash, invalid profile date, invalid heir list এবং file upload limits-এর server-side validation শক্ত করা হয়েছে।
- সিদ্ধান্ত দেওয়ার আগে আবেদনটি এখনো `pending` কি না যাচাই করা হয়।
- Supabase-এর `documents` bucket private করা এবং file size/MIME সীমা নিশ্চিত করার migration যোগ হয়েছে।

### Phase 1 SQL migration
`supabase/schema.sql`, `supabase/auth.sql` ও `supabase/profile-address.sql` আগে চালানো থাকলে Supabase SQL Editor-এ `supabase/phase1-hardening.sql` চালান। এটি পুনরায় চালানো যায়। SQL চালানোর আগে production database backup নিন।

### Phase 1 verification status
- JavaScript-only modules (`lib/auth.js`, `lib/db.js`) syntax check করা হয়েছে।
- পূর্ণ Next.js build এবং end-to-end Supabase test এখনো নিশ্চিত করা যায়নি: এই পরিবেশে npm registry থেকে dependencies install সম্পন্ন হয়নি। Deploy করার আগে নিজস্ব পরিবেশে `npm install` এবং `npm run build` চালান।

## Supabase Auth Email OTP (Phase 2)

এই সংস্করণে Supabase Auth দিয়ে Email OTP নিবন্ধন/নিশ্চিতকরণ, ইমেইল-পাসওয়ার্ড লগইন এবং password recovery আছে। বিদ্যমান server-rendered পেজ চালু রাখতে কাস্টম নাগরিক সেশন রাখা হয়েছে। নতুন ইমেইল-অ্যাকাউন্ট `citizens.auth_user_id` দিয়ে যুক্ত হয়।

### One-time database migration
1. Back up your Supabase database.
2. In Supabase Dashboard -> SQL Editor, run `supabase/email-otp.sql` after `schema.sql` and `auth.sql` have already been applied.
3. Keep `SUPABASE_SERVICE_KEY` server-only. Never add it to a `NEXT_PUBLIC_` variable.

### Environment variables
Keep the existing server variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`, `ADMIN_KEY`, `SITE_URL`) and add these browser-safe values in `.env.local` and your Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Use the same project URL in `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`. The anon/publishable key may be public; the service-role key must not be.

### Supabase Auth dashboard configuration
1. Open Authentication -> URL Configuration. Set Site URL to your real HTTPS domain in production. Add `http://localhost:3000/**` and your production domain plus `/reset-password` to allowed redirect URLs as appropriate.
2. In Authentication -> Email Templates -> Confirm signup, use a template that displays the one-time code, for example `Your verification code is {{ .Token }}`. The register form expects a 6-digit OTP and verifies it with `type: 'signup'`.
3. In Authentication -> Email Templates -> Reset Password, configure the template to display `{{ .Token }}` if you want to enter a recovery OTP manually. The reset page also supports Supabase's recovery link/session flow.
4. Test registration with an email you can access, verify the code, log in, request a recovery email, and change the password.

### Free-tier email limits
The app code does not charge for sending email, but actual delivery is governed by Supabase's current plan and SMTP configuration. Supabase's default email service has strict low-volume limits and may only deliver to authorized/team addresses. For public citizen registrations, configure a supported SMTP provider; many providers offer a limited free tier, but quotas and terms can change. Do not promise unlimited free delivery.

### Important migration note
The old mobile/password login accounts are not automatically converted to Supabase Auth accounts. They remain in the database, but the new login screen uses email/password for Supabase Auth. Existing citizens need a deliberate account-linking/migration flow before their old accounts can use this login. Do not delete old `citizens` rows.

### Phase 2 security notes
- Signup confirmation requires a verified Supabase Auth user before the server creates the citizen profile.
- Password recovery only permits the update form after a recovery OTP or Supabase recovery-link event; a regular existing session alone is not treated as recovery proof.
- After password update, the Supabase client is signed out and the user is redirected to login.
- Supabase Auth rate limits still apply. Avoid exposing detailed auth errors or the service-role key.

## Phase 3 — Admin Dashboard
- `/admin` now has summary cards, search across application number/name/mobile/NID, status/service filters, 20-row client pagination, and CSV export of the filtered results.
- Approval/rejection uses an atomic `status = pending` update to reduce duplicate decisions, and successful decisions/settings changes are written to the admin audit log.
- Admin logout is available. The existing shared `ADMIN_KEY` remains a single-admin gate; this is not role-based access control and should not be used as a substitute for named staff accounts.

### Phase 3 SQL migration
1. Back up the database.
2. Run `supabase/phase3-admin.sql` in Supabase SQL Editor to create the private audit-log table. RLS is enabled with no public policies; server-side service-role access is required.
3. Ensure `SUPABASE_SERVICE_KEY` remains server-only.

### Validation status
`npm install` timed out in the current environment, so a full Next.js build and live Supabase/SMTP end-to-end tests could not be completed here. Run `npm install` and `npm run build` in your own development environment, then test registration, OTP confirmation, login, recovery OTP/link, approval/rejection, audit logs, filters and CSV export against a test Supabase project before production. A source-code change alone cannot verify email delivery, SQL migrations, or deployment environment variables.
# Phase 2–4 update notes

## Phase 2 security corrections
- Password recovery is enabled only after Supabase emits `PASSWORD_RECOVERY` or a recovery OTP is verified. A generic existing session plus a manually edited URL hash is not accepted as proof of recovery.
- Certificate pages now require the signed-in citizen to own the approved application; the old `?mobile=` URL parameter is no longer used as access control.
- Public verification reveals only certificate number, certificate type, holder name, issue date and issuing office. It does not reveal NID, mobile number, address or supporting documents.

## Phase 3 admin controls
- Admin application approval calls a database RPC that atomically changes a pending application and creates a certificate record on approval.
- Admin can revoke an active certificate with a reason or reissue it. Revoked/reissued certificates no longer verify as valid.
- Admin login throttling is still process-local. Use a shared rate limiter (e.g. Redis/Upstash) before production deployment.

## Phase 4 SQL migration
1. Back up Supabase first.
2. Ensure `schema.sql`, `auth.sql`, `profile-address.sql`, `phase1-hardening.sql`, `email-otp.sql`, and `phase3-admin.sql` have been run in the documented order.
3. Run `supabase/phase4-certificates.sql` in Supabase SQL Editor.
4. Confirm `SITE_URL` is the public HTTPS URL of this deployment. Set the correct `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`, and `ADMIN_KEY` in the hosting environment.
5. Run `npm install`, `npm run build`, and test registration, OTP, recovery OTP/link, login, admin approval, certificate print-to-PDF, public QR verification, revocation and reissue.

## PDF note
The certificate page uses the browser's print dialog; choose **Save as PDF** to download an A4 PDF. This avoids generating a server-side PDF that may not embed Bengali glyphs correctly. Add a licensed Bengali font and a tested PDF renderer if a direct-download PDF endpoint is required.

## Test status in this environment
A full Next.js build and live Supabase/SMTP tests could not be run here because npm registry access was unavailable (`EAI_AGAIN registry.npmjs.org`) and no live project credentials were provided. Do not treat this ZIP as production-verified until the checklist above passes.

## Phase 5 — production readiness hardening

### Shared admin login throttling
- Added a database-backed, shared admin login attempt limiter so the attempt counter is not lost between serverless instances.
- **Required migration:** after the previous migrations, back up the database and run `supabase/phase5-production.sql` in Supabase SQL Editor. Until this migration is installed, admin login intentionally fails closed.
- The limiter counts attempts per hashed client IP for a 15-minute window and clears the counter after successful login. It does not store raw IPs. Confirm your hosting provider's trusted proxy headers before deployment; never trust arbitrary client-supplied forwarding headers.
- The single `ADMIN_KEY` gate remains a single-admin model. Named staff accounts and role-based access control (RBAC) are still required before a multi-officer production rollout.

### Operations and CSV safety
- Added `GET /api/health` as a non-sensitive liveness endpoint. It does not confirm database connectivity or email delivery.
- CSV export escapes spreadsheet formula prefixes (`=`, `+`, `-`, `@`) to reduce CSV formula-injection risk.
- Run source/config smoke tests with `npm test` (does not require Next.js dependencies). These tests are not a substitute for a production build or end-to-end tests.

### Deployment checklist
1. Back up the Supabase database.
2. Confirm migrations have been run in order: `schema.sql`, `auth.sql`, `profile-address.sql`, `phase1-hardening.sql`, `email-otp.sql`, `phase3-admin.sql`, `phase4-certificates.sql`, `phase5-production.sql`.
3. Set production HTTPS `SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`, and `ADMIN_KEY` in the hosting environment. Use unique random secrets of at least 32 characters; never commit `.env.local`.
4. Configure Supabase Auth email templates and a supported SMTP provider for public email delivery. Free quotas and deliverability vary by provider; do not assume unlimited free sending.
5. Run `npm install`, `npm test`, `npm run build`, then test signup/OTP, recovery, login, profile ownership, admin approval/rejection, audit log, certificate issuance, public verification, revocation and reissue against a separate test project.
6. Confirm official certificate wording, issuer authority, retention, backups, restore procedures, and privacy notice before issuing real certificates.

### Known work still required before production
- Full `npm run build` and live Supabase/SMTP end-to-end tests have not been run in this environment.
- Admin access still uses one shared secret; add named staff accounts and RBAC for multiple officers.
- Use a trusted proxy IP source or a managed edge rate limiter; review request headers on the target host.
- Certificate printing uses the browser print dialog and “Save as PDF”; it is not a server-generated PDF download endpoint.
- SMS OTP, notification delivery, payment integration and formal accessibility testing are not implemented.

## Phase 6 — Named staff accounts and RBAC

This phase adds separate username/password accounts for staff, with roles:
- `admin`: review applications, update union settings, and manage certificate revocation/reissue.
- `reviewer`: review and decide pending applications.
- `viewer`: no application document or personal-data view; read-only dashboard notice.
- `super_admin`: reserved for the bootstrap `ADMIN_KEY`; can create/disable staff accounts.

### Required migration
1. Back up Supabase first.
2. Ensure `phase3-admin.sql` and `phase5-production.sql` have been applied.
3. Run `supabase/phase6-staff-rbac.sql` in Supabase SQL Editor.
4. Log in to `/admin` with the existing bootstrap `ADMIN_KEY`, then create named staff accounts from the “কর্মকর্তা অ্যাকাউন্ট ও অনুমতি” section.
5. Create a separate username for each person; do not share accounts. Give staff their temporary password securely and ask them to change it through a future account-management flow (self-service password change is not included in this phase).

Passwords are stored as `scrypt` hashes. Staff sessions use HTTP-only, same-site cookies and a separately signed role cookie. Server actions enforce roles; hiding a button in the UI is not treated as authorization.

### Phase 6 scope and remaining production work
- RBAC is implemented for the existing admin actions and staff account create/disable workflow.
- This phase does not add server-generated direct PDF download; certificates still use the browser print dialog / Save as PDF.
- Email/SMS notifications, online payments, staff self-service password changes, MFA, and full end-to-end tests remain future work.
- Run `npm test` and `npm run build` in the deployment environment. The tests do not connect to a live Supabase project and do not verify SMTP delivery.


## Phase 7 — Staff password changes and citizen notifications

- Staff roles (`admin`, `reviewer`, `viewer`) can change their own password after entering the current password and confirming a new password of at least 12 characters. The session is invalidated after a successful change. The bootstrap `ADMIN_KEY` account does not use this form; rotate `ADMIN_KEY` in the deployment environment to change that credential.
- Application approval/rejection creates an in-app notification visible on the citizen dashboard.
- Optional email delivery uses Resend's HTTP API when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Configure a verified sender/domain and review the provider's current quota/terms. If not configured, in-app notifications still work; email is skipped. Provider errors are logged without rolling back the application decision.
- Required migration: back up the database and run `supabase/phase7-notifications-password.sql` after `phase6-staff-rbac.sql`. Notifications are private to server-side service-role access; no anon/authenticated policies are granted.
- PDF certificates still use the existing print page and browser Print → Save as PDF. A dedicated server-generated Bengali PDF endpoint is not included because it requires a tested, licensed Bengali font and PDF renderer.

### Phase 7 verification
Run `npm test`, `npm run build`, then test staff password changes, application approval/rejection, citizen notification visibility, optional email delivery, and the full certificate verification flow against a separate Supabase test project. This package has not been tested against live Supabase credentials in this environment.

## Phase 8 — direct PDF download and deployment checks

- Added `GET /certificate/[application-no]/pdf`, which generates a downloadable A4 PDF with the locally bundled Noto Sans Bengali regular/bold fonts, certificate number, issue date and QR verification URL. The endpoint requires a valid citizen session and checks that the application belongs to that citizen and is approved. Responses are private/no-store.
- The certificate page and citizen dashboard now show a direct PDF download link. Browser print remains available as a fallback.
- Bengali fonts are bundled under `public/fonts/`; see `public/fonts/OFL-Noto-fonts.txt` for license information.
- Added `/api/health/ready`, which checks whether the app can query the database and reports only a boolean email-provider-configured flag; it never returns secrets. `/api/health` remains a liveness-only endpoint.
- Added `npm run test:email` as an explicit, opt-in Resend delivery test. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_TEST_TO` only when you intentionally want to send one real test email. Provider acceptance is not proof of inbox delivery; check inbox/spam. This test can send an actual email and should not be run unintentionally.

### Phase 8 checks
1. Run all prior SQL migrations in the documented order; Phase 8 does not require a new SQL migration.
2. Set `SITE_URL` to the production HTTPS origin and verify `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`, `ADMIN_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm install`, `npm test`, and `npm run build`.
4. Test a logged-in citizen downloading their own approved certificate. Confirm another citizen receives 404, logged-out requests receive 401, and revoked/reissued certificates cannot be downloaded through the active-certificate path.
5. Open a downloaded PDF on Android and desktop and inspect Bangla conjuncts, vowel signs, QR scan, page breaks, and text clipping. React-PDF and font shaping should be visually verified before official use; use the browser print fallback if the PDF output does not match the approved certificate layout.
6. Visit `/api/health/ready` to confirm database readiness. For email, run `npm run test:email` only with an explicitly configured test recipient and verify the actual inbox.

### Phase 8 verification status
- Static/source tests and ZIP integrity can be run in the project environment.
- A full Next.js build and live Supabase/Resend end-to-end test have not been performed in this packaging environment. Do not treat the ZIP as production-verified until the checks above pass.

---

## Phase 9 — Integration & Security Review

এই পর্যায়ে নিম্নলিখিত প্রতিরক্ষা যোগ করা হয়েছে:

- প্রতিটি `/admin` request ও server action-এ staff cookie-এর স্বাক্ষর/মেয়াদ যাচাইয়ের পাশাপাশি Supabase `staff_users` রেকর্ডটি এখনও active এবং cookie-র role-এর সঙ্গে মেলে কি না পুনরায় যাচাই হয়। অ্যাকাউন্ট বন্ধ বা role পরিবর্তন হলে পুরোনো session আর অনুমতি পাবে না।
- `viewer` ভূমিকার জন্য application rows, private document signed URLs, certificate inventory, settings এবং audit log fetch করা হয় না।
- সাধারণ security response headers যোগ হয়েছে: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; production-এ HTTPS HSTS-ও যোগ হয়।
- PDF endpoint-এ লগইন, আবেদন-মালিকানা, approved status এবং active certificate যাচাই করা হয়; response `no-store`।
- `tests/phase9-security.test.mjs`-এ এসব security invariant-এর source-level regression tests আছে।

### Phase 9 migration

এই phase-এর জন্য নতুন SQL migration নেই। আগের migrations সঠিক ক্রমে প্রয়োগ থাকতে হবে, বিশেষ করে `phase5-production.sql`, `phase6-staff-rbac.sql`, `phase4-certificates.sql` এবং `phase3-admin.sql`। Production database-এ SQL চালানোর আগে backup নিন।

### Run checks

```bash
npm install
npm test
npm run build
```

`npm test` source-level regression tests চালায়; এটি live Supabase, browser E2E, email delivery, PDF visual rendering বা production build-এর বিকল্প নয়। এই repository bundle-এ network/database credentials না থাকায় এসব live checks স্বয়ংক্রিয়ভাবে সম্পন্ন হয় না।

### Manual integration checklist

1. Build সফল হয় এবং Vercel deployment-এ PDF fonts/assets include হয়।
2. Supabase Email OTP signup, confirmation, login, recovery OTP/link ও password reset বাস্তবে পরীক্ষা হয়।
3. `viewer` দিয়ে লগইন করলে application/document/certificate/audit data fetch বা render হয় না।
4. Staff account deactivate বা role পরিবর্তন করার পর আগের session দিয়ে কোনো privileged action করা যায় না।
5. অন্য নাগরিকের application number দিয়ে PDF endpoint 404 দেয়; নিজের approved application-এর active certificate-ই শুধু ডাউনলোড হয়।
6. বাংলা PDF-এর যুক্তাক্ষর, page breaks, QR scan এবং certificate revoke/reissue browser/PDF viewer-এ দেখা হয়।
7. Production env-এ HTTPS, `ADMIN_KEY`, `SESSION_SECRET`, Supabase service key, RLS ও backup restore পরীক্ষা করা হয়।

> Status: source-level tests only. পূর্ণ Next.js production build এবং live Supabase/E2E tests না চালানো পর্যন্ত deployment-কে production-ready বলে গণ্য করবেন না।

## Phase 10 — Finance ledger

See `README-PHASE10.md` and apply `supabase/phase10-finance.sql` after all previous migrations. This phase supports configured service fees and manual/offline payment-reference review; it does **not** yet integrate a live payment gateway. No fee amount is enabled by default. Use only the official approved fee schedule.

## Phase 11 — Citizen Support, Complaints & Public Notices

1. Back up the Supabase database.
2. Ensure migrations for phases 1–10 have been applied in order.
3. Run `supabase/phase11-support-notices.sql` in the Supabase SQL Editor.
4. Run `npm install`, `npm test`, `npm run build`, and `npm run dev`.
5. Citizens can use `/support` to submit and track their complaints and `/notices` to read published notices.
6. Authorized staff can use `/admin/support` to review complaints, reply, publish notices, and archive notices. Complaint review requires `super_admin`, `admin`, or `reviewer`; notice publishing/archiving requires `super_admin` or `admin`.

The app accesses these tables through the server-side Supabase service key. RLS is enabled and no browser-access policies are created. Never expose `SUPABASE_SERVICE_KEY` to client code. Verify role/session behavior, notice expiration, complaint notifications, and all SQL migrations in a staging project before production use.

## Phase 12 — Deployment, monitoring and backup

See `docs/PHASE12-DEPLOYMENT-BACKUP.md` for the Vercel deployment runbook, environment validation, post-deployment smoke test, monitoring and backup/restore checklist.

- `npm run check:env`: validates required environment variable presence without printing values.
- `npm run smoke:production`: checks the deployed HTTPS liveness/readiness endpoints. A readiness HTTP 503 is treated as failure.
- `.github/workflows/ci.yml`: runs tests and Next.js build on push and pull request.

These checks do not replace live end-to-end testing or a verified backup/restore drill. Database backups are not created automatically by this repository.
