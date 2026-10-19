const base = String(process.env.SITE_URL || '').replace(/\/$/, '');
if (!/^https:\/\//i.test(base)) {
  console.error('Set SITE_URL to the deployed HTTPS origin, e.g. https://portal.example.gov.bd');
  process.exit(2);
}
const checks = [
  { path: '/api/health', expected: 200, label: 'liveness' },
  { path: '/api/health/ready', expected: [200, 503], label: 'readiness (503 means dependency/config not ready)' },
];
let failed = false;
for (const check of checks) {
  try {
    const response = await fetch(`${base}${check.path}`, { headers: { accept: 'application/json' }, redirect: 'manual' });
    const allowed = Array.isArray(check.expected) ? check.expected.includes(response.status) : response.status === check.expected;
    const cache = response.headers.get('cache-control') || '';
    let safe = true;
    let body = {};
    try { body = await response.json(); } catch { safe = false; }
    const bodyText = JSON.stringify(body);
    if (/SUPABASE_SERVICE_KEY|ADMIN_KEY|SESSION_SECRET|RESEND_API_KEY|service_role/i.test(bodyText)) safe = false;
    console.log(`${allowed && safe ? 'PASS' : 'FAIL'} ${check.label}: HTTP ${response.status}; cache-control=${cache || '(missing)'}`);
    if (!allowed || !safe) failed = true;
    if (check.path === '/api/health' && !/no-store/i.test(cache)) failed = true;
    if (check.path === '/api/health/ready' && response.status === 503) failed = true;
  } catch (error) {
    console.error(`FAIL ${check.label}: request failed (${error?.name || 'network error'})`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
