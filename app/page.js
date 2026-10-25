import { SERVICES, ICON } from '../lib/services';
import { Icon } from '../lib/icons';
const FEAT = [['home', 'ঘরে বসে আবেদন', 'অফিসে না গিয়ে আবেদন জমা দিন'], ['qr', 'QR কোডে যাচাই', 'প্রতিটি সনদের সত্যতা মুহূর্তেই'], ['lock', 'তথ্য সুরক্ষিত', 'নথি গোপনে সংরক্ষিত থাকে'], ['clock', 'অবস্থা জানুন', 'ড্যাশবোর্ডে আবেদনের অবস্থা দেখুন']];
const STEPS = [['user', 'নিবন্ধন ও প্রোফাইল', 'ইমেইল দিয়ে নিবন্ধন করে প্রোফাইল ১০০% সম্পূর্ণ করুন।'], ['file', 'আবেদন জমা দিন', 'সেবা বেছে প্রয়োজনীয় তথ্য ও নথি দিন, ফি ওয়ালেট থেকে কাটা হবে।'], ['shield', 'অনুমোদন', 'ইউনিয়ন পরিষদের কর্মকর্তা আবেদন যাচাই করে অনুমোদন দেন।'], ['qr', 'প্রিন্ট ও যাচাই', 'লগইন করে QR কোডসহ সনদ প্রিন্ট করুন, যে কেউ যাচাই করতে পারবে।']];
const FAQ = [
  ['আবেদন জমা দেওয়ার পর কী হয়?', 'ইউনিয়ন পরিষদের কর্মকর্তা আপনার তথ্য ও নথি যাচাই করে অনুমোদন বা বাতিল করেন। সিদ্ধান্ত ইমেইলে জানানো হয় এবং ড্যাশবোর্ডেও দেখা যায়।'],
  ['সেবার ফি কীভাবে দেব?', 'ওয়ালেটে টাকা যোগ করে নিন। বাংলা QR স্ক্যান করে bKash, Nagad, Rocket বা ব্যাংক অ্যাপ থেকে পাঠিয়ে TrxID জমা দিলে অ্যাডমিন যাচাই করে ব্যালেন্স যোগ করেন। আবেদন বাতিল হলে ফি ওয়ালেটে ফেরত আসে।'],
  ['সনদ কীভাবে প্রিন্ট করব?', 'অনুমোদনের পর লগইন করে ড্যাশবোর্ডের "সনদ দেখুন ও প্রিন্ট" লিংকে যান।'],
  ['সনদ আসল কি না কীভাবে যাচাই করব?', 'সনদে থাকা QR কোড স্ক্যান করুন অথবা "সনদ যাচাই" পেজে সনদ নম্বর লিখুন। এর জন্য লগইন লাগে না।'],
  ['উদ্যোক্তা কারা?', 'ডিজিটাল সেন্টারের উদ্যোক্তারা অ্যাডমিনের অনুমতি নিয়ে অন্যের হয়ে আবেদন করতে পারেন। নাগরিক অ্যাকাউন্ট থেকেই উদ্যোক্তা হওয়ার আবেদন করা যায়।'],
];
const btnLight = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-600 no-underline shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl';
const btnGhost = 'inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white/70 px-6 font-semibold text-white no-underline transition hover:bg-white/10';
export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-600 to-brand-500 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_.9fr] lg:pb-32">
          <div className="hero-copy">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold backdrop-blur"><Icon n="shield" size={16} />ডিজিটাল সনদ সেবা</span>
            <h1 className="mb-0 mt-5 text-[clamp(30px,5.2vw,54px)] font-bold leading-[1.2] tracking-tight">নাগরিক সেবা হবে আরও সহজ, দ্রুত ও নির্ভুল</h1>
            <p className="m-0 mt-4 max-w-xl text-[clamp(16px,2vw,19px)] leading-relaxed text-white/80">নাগরিকত্ব, চারিত্রিক, ওয়ারিশ ও আয়ের সনদসহ নানা সনদ ও প্রত্যয়ন এখন অনলাইনে। প্রতিটি সনদে QR কোড, তাই সত্যতা যাচাই মুহূর্তেই।</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#services" className={btnLight}>সেবাসমূহ দেখুন <Icon n="arrow" size={18} /></a>
              <a href="/register" className={btnGhost}>নাগরিক নিবন্ধন</a>
            </div>
          </div>
          <form action="/verify" className="rounded-3xl bg-white p-6 text-ink shadow-2xl sm:p-8">
            <h2 className="m-0 flex items-center gap-2 text-xl"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon n="qr" size={20} /></span>সনদ যাচাই করুন</h2>
            <p className="m-0 mt-2 text-sm text-muted">সনদে থাকা নম্বরটি লিখুন অথবা QR কোড স্ক্যান করুন।</p>
            <label htmlFor="no" className="mt-5 block text-sm font-semibold">সনদ নম্বর</label>
            <input id="no" name="no" required placeholder="সনদ নম্বর লিখুন" className="mt-1.5 w-full" />
            <button className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-brand-600 px-6 text-base font-bold text-white shadow-md transition hover:bg-brand-500 active:scale-[.98]" style={{ font: 'inherit', fontWeight: 700 }}><Icon n="search" size={18} />যাচাই করুন</button>
          </form>
        </div>
      </section>
      <section className="relative z-10 mx-auto -mt-10 grid max-w-6xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {FEAT.map(([ic, t, d], i) => (
          <div key={t} style={{ '--n': i }} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon n={ic} /></span>
            <div className="leading-snug"><b className="block">{t}</b><span className="text-sm text-muted">{d}</span></div>
          </div>
        ))}
      </section>
      <section id="services" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <h2 className="m-0 text-[clamp(24px,3.4vw,32px)]">সনদ সেবা</h2>
        <p className="m-0 mb-6 mt-1 text-muted">প্রয়োজনীয় সেবাটি বেছে নিয়ে আবেদন করুন</p>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <a key={s} style={{ '--n': i }} href={`/apply?service=${encodeURIComponent(s)}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 text-ink no-underline shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-lg">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white"><Icon n={ICON[s] || 'file'} /></span>
              <span className="flex-1 text-base font-semibold">{s}</span>
              <Icon n="arrow" size={18} className="text-muted transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </a>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <h2 className="m-0 mb-6 text-[clamp(24px,3.4vw,32px)]">কীভাবে কাজ করে</h2>
        <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([ic, t, d], i) => (
            <li key={t} style={{ '--n': i }} className="relative rounded-2xl border border-line bg-white p-5 shadow-soft">
              <span className="absolute right-4 top-3 text-4xl font-bold text-brand-100">{['১', '২', '৩', '৪'][i]}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><Icon n={ic} /></span>
              <b className="mt-3 block text-lg">{t}</b>
              <p className="m-0 mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-7 text-white sm:flex-row sm:items-center sm:p-10">
          <div><h2 className="m-0 text-[clamp(22px,3vw,28px)]">উদ্যোক্তা হিসেবে অন্যের জন্য আবেদন করুন</h2><p className="m-0 mt-2 max-w-xl text-white/80">ডিজিটাল সেন্টারের উদ্যোক্তারা অ্যাডমিনের অনুমতি নিয়ে নাগরিকদের হয়ে সনদের আবেদন করতে পারেন।</p></div>
          <a href="/entrepreneur" className={btnLight}>উদ্যোক্তা হতে আবেদন <Icon n="arrow" size={18} /></a>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
        <h2 className="m-0 mb-6 text-center text-[clamp(24px,3.4vw,32px)]">সচরাচর জিজ্ঞাসা</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-line bg-white px-5 py-4 shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">{q}<Icon n="arrow" size={18} className="shrink-0 rotate-90 text-muted transition group-open:-rotate-90" /></summary>
              <p className="m-0 mt-3 text-[15px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
