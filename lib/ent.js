import { redirect } from 'next/navigation';
import { requireCitizen } from './auth';
// শুধু অনুমোদিত উদ্যোক্তা ঢুকতে পারেন। প্রত্যাহার করলে সঙ্গে সঙ্গে অনুমতি যায়।
export async function requireEnt(next = '/ent') {
  const u = await requireCitizen(next);
  if (u.ent_status !== 'approved') redirect('/ent/join');
  return u;
}
