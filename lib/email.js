// Optional transactional email. Configure RESEND_API_KEY and EMAIL_FROM to enable.
export async function sendTransactionalEmail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || !to) return { sent: false, reason: 'email_not_configured' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Transactional email failed:', response.status, detail.slice(0, 300));
    return { sent: false, reason: 'provider_error' };
  }
  return { sent: true };
}
