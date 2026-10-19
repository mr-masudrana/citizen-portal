# Phase 12 — Deployment, Monitoring, Backup & Restore

This phase adds deployment guardrails and runbooks. It does **not** deploy the site automatically and does not create a database backup by itself.

## 1. Environment validation

Run `npm run check:env` before local deployment. It validates required variable presence, minimum lengths for `ADMIN_KEY`/`SESSION_SECRET`, matching Supabase project URLs, and HTTPS `SITE_URL` in production. It never prints values. For local use, set the variables in `.env.local` first.

Required server-only variables: `ADMIN_KEY`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SITE_URL`. Browser-safe variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keep `SUPABASE_SERVICE_KEY` server-side only. Configure optional Resend variables only if using email.

## 2. CI and local checks

GitHub Actions workflow `.github/workflows/ci.yml` runs `npm install`, `npm test`, and `npm run build` on pushes and pull requests. Configure production secrets only in the hosting provider; CI tests/build should not need real production secrets unless the app build explicitly requires them.

Before release:

```bash
npm install
npm run check:env
npm test
npm run build
```

If build fails, stop deployment and fix it first. Do not mark a release successful from source tests alone.

## 3. Vercel deployment runbook

1. Import the repository into Vercel and select the Next.js framework.
2. Set the required environment variables separately for Preview and Production. Use the correct Supabase project for each environment.
3. Confirm `SITE_URL` is the actual HTTPS production origin; add it to Supabase Auth URL Configuration and allowed redirect URLs.
4. Keep the Supabase service-role key out of browser variables and source control.
5. Deploy to Preview first. Test signup/Email OTP, login, password recovery, staff roles, application ownership, complaints/notices, fee reference workflow, certificate PDF and QR verification.
6. Promote to Production only after all tests pass and a backup/restore plan has been verified.

## 4. Post-deploy smoke test

Set `SITE_URL` to the deployed HTTPS origin and run:

```bash
npm run smoke:production
```

The script checks `/api/health` and `/api/health/ready`, verifies response codes, and checks that health JSON does not disclose secret names/values. Readiness must return HTTP 200. A 503 means the deployment is not ready; investigate Supabase connectivity/configuration. This is a one-shot test, not continuous uptime monitoring.

## 5. Monitoring

- Use your hosting provider's deployment/function logs and configure alerts for repeated 5xx responses, failed deployments, elevated latency and function timeouts.
- Add an external uptime monitor to `https://YOUR_DOMAIN/api/health` at an appropriate interval; keep `/api/health/ready` available for operational checks. Avoid sending secrets or personal data in monitor payloads.
- Review Supabase Auth/database/storage logs and email provider logs. Alert on unusual admin login failures, repeated rate-limit events and failed certificate/payment actions.
- Keep a written incident contact and rollback owner. Do not log passwords, OTPs, service-role keys, full NID values, private document URLs or session cookies.

## 6. Backup and restore

Backups are not automated by this repository. Choose a backup capability appropriate to your Supabase plan and retention requirements; verify current plan limits in the Supabase dashboard/documentation.

Before each production SQL migration:
1. Record the current deployed commit and migration name.
2. Create/confirm a recoverable database backup or export, and separately inventory private Storage objects if needed.
3. Apply the migration in staging first and run smoke tests.
4. Apply to production only after review.

At least quarterly, test restoration into a separate non-production Supabase project. Verify schema, representative records, storage object references, auth flows, RLS policies and certificate verification. A backup that has not been restored in a test is not a proven recovery plan. Never restore test data over production.

## 7. Release checklist

- [ ] `npm run check:env` passes for the intended environment.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Required SQL migrations are applied in the documented order.
- [ ] Supabase RLS and private storage bucket settings are reviewed.
- [ ] Email OTP and password recovery tested with a real mailbox.
- [ ] Citizen ownership and each staff role tested against unauthorized access.
- [ ] Certificate PDF Bengali text, QR verification, cancellation and reissue tested.
- [ ] Complaint/notices and payment-reference workflows tested.
- [ ] Production smoke test returns success and readiness HTTP 200.
- [ ] Backup and restore process documented and tested.
- [ ] Monitoring/alert recipients and rollback plan confirmed.

Do not claim government certification or legal validity based solely on technical checks. Certificate templates, fees and authorization workflow must be approved by the relevant authority.
