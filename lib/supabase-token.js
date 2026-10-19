import { createClient } from '@supabase/supabase-js';
import { getByAuthUserId } from './db';
export async function verifiedSupabaseUser(accessToken) {
  if (typeof accessToken !== 'string' || accessToken.length < 20 || accessToken.length > 5000) return { user: null, error: 'অবৈধ সেশন। আবার লগইন করুন।' };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null, error: 'Supabase public URL/key environment variables সেট করা নেই।' };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data?.user) return { user: null, error: 'সেশন যাচাই করা যায়নি। আবার লগইন করুন।' };
  if (!data.user.email_confirmed_at) return { user: null, error: 'আগে ইমেইল যাচাই করুন।' };
  return { user: data.user, error: null };
}
export async function linkedCitizen(user) {
  if (!user?.id) return null;
  return getByAuthUserId(user.id);
}
