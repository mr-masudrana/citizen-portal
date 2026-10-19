import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '../../../../lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  let database = 'ok';
  try { await checkDatabaseConnection(); } catch { database = 'error'; }
  const body = { ok: database === 'ok', service: 'citizen-portal', database, emailProviderConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) };
  return NextResponse.json(body, { status: body.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
