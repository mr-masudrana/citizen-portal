import { SERVICES, ICON } from '../lib/services';
import { Icon } from '../lib/icons';
import { bn } from '../lib/templates';
import ServiceGrid from './ServiceGrid';
const FEAT = [['home', 'ঘরে বসে আবেদন', 'অফিসে না গিয়ে আবেদন জমা দিন'], ['qr', 'QR কোডে যাচাই', 'সনদের সত্যতা মুহূর্তেই জানা যায়'], ['lock', 'নথি সুরক্ষিত', 'আপনার নথি গোপনে সংরক্ষিত থাকে'], ['clock', 'অবস্থা দেখুন', 'ড্যাশবোর্ডে আবেদনের অবস্থা জানুন']];
const STEPS = [['user', 'নিবন্ধন ও প্রোফাইল', 'ইমেইল দিয়ে নিবন্ধন করে প্রোফাইল ১০০% সম্পূর্ণ করুন।'], ['file', 'আবেদন জমা দিন', 'সেবা বেছে প্রয়োজনীয় তথ্য ও নথি দিন।'], ['shield', 'অনুমোদন', 'ইউনিয়ন পরিষদের কর্মকর্তা আবেদন যাচাই করে অনুমোদন দেন।'], ['qr', 'প্রিন্ট ও যাচাই', 'QR কোডসহ সনদ প্রিন্ট করুন, যে কেউ যাচাই করতে পারবে।']];
export default function Home() {
  const items = SERVICES.map((s) => ({ name: s, icon: ICON[s] || 'file' }));
  return (
    <>
      <section className="hero"><div className="hero-in">
        <div className="hero-copy">
          <h1>ইউনিয়ন পরিষদের সনদ, এখন ঘরে বসেই</h1>
          <p>নাগরিকত্ব, চারিত্রিক, ওয়ারিশ ও আয়ের সনদসহ {bn(SERVICES.length)}টি সেবার আবেদন অনলাইনে করুন। প্রতিটি সনদে QR কোড থাকে, তাই সত্যতা মুহূর্তেই যাচাই করা যায়।</p>
          <div className="cta"><a className="btn light" href="#services">আবেদন শুরু করুন <Icon n="arrow" size={18} /></a><a className="btn ghost" href="/register">নাগরিক নিবন্ধন</a></div>
        </div>
        <form className="card hero-card" action="/verify">
          <h2><Icon n="qr" size={22} /> সনদ যাচাই করুন</h2>
          <label htmlFor="no">সনদ নম্বর</label>
          <input id="no" name="no" required placeholder="যেমন: S1A2B3C4D" autoComplete="off" />
          <button className="btn"><Icon n="search" size={18} /> যাচাই করুন</button>
          <p className="hero-note">সনদে ছাপা QR কোড স্ক্যান করেও যাচাই করা যায়। লগইন লাগে না।</p>
        </form>
      </div></section>
      <section className="feat" aria-label="সুবিধা">{FEAT.map(([ic, t, d]) => <div key={t} className="f"><span className="ic"><Icon n={ic} /></span><div><b>{t}</b><span>{d}</span></div></div>)}</section>
      <section id="services" className="wrap sec">
        <h2>সনদ সেবা</h2><p className="sub">প্রয়োজনীয় সেবাটি বেছে নিয়ে আবেদন করুন।</p>
        <ServiceGrid items={items} />
      </section>
      <section className="wrap sec" style={{ paddingTop: 8 }}>
        <h2>কীভাবে কাজ করে</h2><p className="sub">চারটি ধাপে সনদ হাতে পাবেন।</p>
        <div className="grid steps">{STEPS.map(([ic, t, d], i) => (
          <div key={t} className="card step"><span className="num" aria-hidden="true">{bn(i + 1)}</span><span className="ic"><Icon n={ic} /></span><b>{t}</b><p>{d}</p></div>
        ))}</div>
      </section>
    </>
  );
}
