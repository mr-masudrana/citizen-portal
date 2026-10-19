import { SERVICES, HEIR, ICON } from '../lib/services';
import { Icon } from '../lib/icons';
const FEAT = [['home', 'ঘরে বসে আবেদন', 'অফিসে না গিয়েই আবেদন জমা দিন'], ['qr', 'QR কোডে যাচাই', 'প্রতিটি সনদের সত্যতা মুহূর্তেই'], ['lock', 'তথ্য সুরক্ষিত', 'নথি গোপনে সংরক্ষিত থাকে'], ['clock', 'অবস্থা জানুন', 'আবেদনের অবস্থা অনলাইনে দেখুন']];
const STEPS = [['user', 'নিবন্ধন ও প্রোফাইল', 'ইমেইল দিয়ে নিবন্ধন করে প্রোফাইল ১০০% সম্পূর্ণ করুন।'], ['file', 'আবেদন জমা দিন', 'সেবা বেছে প্রয়োজনীয় তথ্য ও নথি দিন।'], ['shield', 'অনুমোদন', 'ইউনিয়ন পরিষদের কর্মকর্তা আবেদন যাচাই করে অনুমোদন দেন।'], ['qr', 'প্রিন্ট ও যাচাই', 'QR কোডসহ সনদ প্রিন্ট করুন, যে কেউ যাচাই করতে পারবে।']];
export default function Home() {
  return (
    <>
      <section className="hero"><div className="wrap hero-in">
        <div className="hero-copy">
          <span className="pill"><Icon n="shield" size={16} />ডিজিটাল সনদ সেবা</span>
          <h1>নাগরিক সেবা হবে আরও সহজ, দ্রুত ও নির্ভুল</h1>
          <p>নাগরিকত্ব, চারিত্রিক, ওয়ারিশ ও আয়ের সনদসহ নানা সনদ ও প্রত্যয়ন এখন অনলাইনে। প্রতিটি সনদে QR কোড, তাই সত্যতা যাচাই মুহূর্তেই।</p>
          <div className="cta"><a className="btn light" href="#services">সেবাসমূহ দেখুন <Icon n="arrow" size={18} /></a><a className="btn ghost" href="/register">নাগরিক নিবন্ধন</a></div>
        </div>
        <form className="card hero-card" action="/verify">
          <h2><Icon n="qr" size={22} /> ডিজিটাল সনদ যাচাই করুন</h2>
          <label htmlFor="no">সনদ নম্বর</label>
          <input id="no" name="no" required placeholder="সনদ নম্বর লিখুন" />
          <button className="btn" style={{ width: '100%' }}><Icon n="search" size={18} /> যাচাই করুন</button>
        </form>
      </div></section>
      <section className="feat">{FEAT.map(([ic, t, d], i) => <div key={t} className="f" style={{ '--n': i }}><span className="ic"><Icon n={ic} /></span><div><b>{t}</b><span>{d}</span></div></div>)}</section>
      <section id="services" className="wrap sec">
        <h2>সনদ সেবা</h2><p className="sub">প্রয়োজনীয় সেবাটি বেছে নিয়ে আবেদন করুন</p>
        <div className="grid">{SERVICES.map((s, i) => (
          <a key={s} className="svc" style={{ '--n': i }} href={HEIR.includes(s) ? `/warish?service=${encodeURIComponent(s)}` : `/apply?service=${encodeURIComponent(s)}`}>
            <span className="ic"><Icon n={ICON[s] || 'file'} /></span><span className="svc-t">{s}</span><Icon n="arrow" size={16} className="go" />
          </a>
        ))}</div>
      </section>
      <section className="wrap sec">
        <h2>কীভাবে কাজ করে</h2>
        <div className="grid steps">{STEPS.map(([ic, t, d], i) => (
          <div key={t} className="card step" style={{ '--n': i }}><span className="num">{['১', '২', '৩', '৪'][i]}</span><span className="ic"><Icon n={ic} /></span><b>{t}</b><p>{d}</p></div>
        ))}</div>
      </section>
    </>
  );
}
