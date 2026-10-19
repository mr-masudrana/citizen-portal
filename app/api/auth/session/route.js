import { NextResponse } from 'next/server';
import { verifiedSupabaseUser } from '../../../../lib/supabase-token';
import { getByAuthUserId } from '../../../../lib/db';
import { startSession } from '../../../../lib/auth';
export const runtime = 'nodejs';
export async function POST(request) {
  try {
    const body = await request.json();
    const { user, error } = await verifiedSupabaseUser(body?.access_token);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const citizen = await getByAuthUserId(user.id);
    if (!citizen) return NextResponse.json({ error: 'এই ইমেইলের সঙ্গে নাগরিক প্রোফাইল নেই। নিবন্ধন সম্পন্ন করুন।' }, { status: 404 });
    startSession(citizen.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('auth session failed:', err?.message || err);
    return NextResponse.json({ error: 'লগইন সেশন তৈরি করা যায়নি।' }, { status: 500 });
  }
}
