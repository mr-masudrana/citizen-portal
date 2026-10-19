// Explicit opt-in smoke test: sends one real email to EMAIL_TEST_TO.
const key = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const to = process.env.EMAIL_TEST_TO;
if (!key || !from || !to) {
  console.error('Email test not sent. Set RESEND_API_KEY, EMAIL_FROM and EMAIL_TEST_TO explicitly.');
  process.exit(2);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error('EMAIL_TEST_TO must be a valid email address.');
  process.exit(2);
}
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from, to: [to], subject: 'Citizen Portal — Email delivery test', text: 'This is an explicitly requested test message from your Citizen Portal deployment. If you received it, provider delivery is working for this recipient.' }),
});
const body = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(`Email provider rejected the test (HTTP ${response.status}): ${String(body.message || body.name || 'unknown provider error').slice(0, 300)}`);
  process.exit(1);
}
console.log(`Provider accepted the test email. Message ID: ${body.id || '(not returned)'}. Check inbox and spam to confirm delivery.`);
