import { redirect } from 'next/navigation';
// উদ্যোক্তার প্যানেল এখন সাধারণ ড্যাশবোর্ডের "অন্যের জন্য দাখিল" ট্যাবে।
export default function Ent() { redirect('/dashboard?tab=filed'); }
