# নাগরিক সেবা পোর্টাল (Next.js 14 + Supabase)

## প্রথমবার সেটআপ
1. https://supabase.com এ একটি প্রজেক্ট খুলুন।
2. Dashboard > SQL Editor-এ `supabase/schema.sql` ফাইলের লেখা পেস্ট করে Run দিন (টেবিল ও গোপন `documents` বাকেট তৈরি হবে)।
3. Project Settings > API থেকে Project URL এবং `service_role` key নিন।
4. `.env.example` কপি করে `.env.local` নাম দিন এবং মান বসান। `service_role` key শুধু সার্ভারে থাকবে, কোথাও প্রকাশ করবেন না।
5. `npm install` তারপর `npm run dev` → http://localhost:3000

## পেজ
- `/` হোম, `/apply` সাধারণ আবেদন, `/warish` ওয়ারিশ সনদের আবেদন
- `/track` অবস্থা, `/verify` সনদ যাচাই
- `/admin` কর্মকর্তার অনুমোদন ও নথি দেখা (ADMIN_KEY দিয়ে প্রবেশ)
- `/certificate/[নম্বর]?mobile=...` সনদ প্রিন্ট

## জেনে রাখুন
- ফাইল: সর্বোচ্চ ৩টি, প্রতিটি ১ MB, JPG/PNG/PDF। নথি গোপন বাকেটে থাকে, কর্মকর্তা ১০ মিনিটের অস্থায়ী লিংকে দেখেন।
- Vercel-এ ডিপ্লয় করলে একই env মানগুলো Project Settings > Environment Variables-এ দিন। Vercel-এ রিকোয়েস্টের সীমা ৪.৫ MB।
- সনদের ভাষা সাধারণ। আপনার ইউনিয়ন পরিষদের অনুমোদিত ফরম্যাট বসাতে হবে।
- এখনো নেই: পেমেন্ট, ইউনিয়ন নিবন্ধন, SMS, পূর্ণ লগইন সিস্টেম।
