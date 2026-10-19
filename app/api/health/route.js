import { NextResponse } from 'next/server';

// Public, non-sensitive liveness endpoint. It intentionally reveals no env/config details.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ ok: true, service: 'citizen-portal', timestamp: new Date().toISOString() }, {
    status: 200, headers: { 'Cache-Control': 'no-store' },
  });
}
