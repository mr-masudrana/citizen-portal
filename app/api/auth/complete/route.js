import { NextResponse } from 'next/server';
import { verifiedSupabaseUser } from '../../../../lib/supabase-token';
import { getByMobile, getByAuthUserId, addEmailCitizen } from '../../../../lib/db';
import { startSession } from '../../../../lib/auth';
export const runtime = 'nodejs';
export async function POST(request) {
  try {
    const body = await request.json();
    const { user, error } = await verifiedSupabaseUser(body?.access_token);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
    if (!name || name.length > 120 || !/^01\d{9}$/.test(mobile) || !user.email) return NextResponse.json({ error: 'নাম, সঠিক মোবাইল নম্বর ও যাচাইকৃত ইমেইল প্রয়োজন।' }, { status: 400 });
    const existingAuth = await getByAuthUserId(user.id);
    if (existingAuth) { startSession(existingAuth.id); return NextResponse.json({ ok: true }); }
    const existingMobile = await getByMobile(mobile);
    if (existingMobile) return NextResponse.json({ error: 'এই মোবাইল নম্বর আগে থেকেই নিবন্ধিত। অন্য নম্বর ব্যবহার করুন বা সহায়তা নিন।' }, { status: 409 });
    const citizen = await addEmailCitizen({ auth_user_id: user.id, email: user.email.toLowerCase(), name, mobile });
    startSession(citizen.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = String(err?.message || 'অ্যাকাউন্ট তৈরি করা যায়নি.');
    if (/duplicate key|citizens_mobile_key|unique constraint/i.test(msg)) return NextResponse.json({ error: 'এই মোবাইল নম্বর বা ইমেইল আগে থেকেই ব্যবহৃত হয়েছে।' }, { status: 409 });
    console.error('auth complete failed:', msg);
    return NextResponse.json({ error: 'অ্যাকাউন্ট তৈরি করা যায়নি। ডেটাবেজ migration ও Supabase সেটিংস যাচাই করুন।' }, { status: 500 });
  }
}
