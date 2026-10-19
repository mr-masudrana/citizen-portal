const production = process.env.NODE_ENV === 'production';
const required = ['ADMIN_KEY', 'SESSION_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((key) => !String(process.env[key] || '').trim());
const errors = [];
if (missing.length) errors.push(`Missing required environment variables: ${missing.join(', ')}`);
for (const key of ['ADMIN_KEY', 'SESSION_SECRET']) {
  const value = String(process.env[key] || '');
  if (value && value.length < 32) errors.push(`${key} must be at least 32 characters.`);
}
if (process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
  errors.push('SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL must point to the same Supabase project.');
}
if (production) {
  if (!/^https:\/\//i.test(process.env.SITE_URL || '')) errors.push('SITE_URL must use HTTPS in production.');
  if (/YOUR-PROJECT|replace-with|your-.*-key/i.test([process.env.ADMIN_KEY, process.env.SESSION_SECRET, process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY].join(' '))) {
    errors.push('Placeholder-looking secret/configuration value detected.');
  }
}
if (errors.length) {
  console.error('Environment check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Environment check passed (${production ? 'production' : 'development'}). Values are not printed.`);
}
