import { SERVICES } from '../lib/services';
const STEPS = [['তথ্য দিন', 'ফর্মে আবেদনকারীর তথ্য লিখে জমা দিন।'], ['অনুমোদন', 'ইউনিয়ন পরিষদের কর্মকর্তা আবেদন যাচাই করে অনুমোদন দেন।'], ['প্রিন্ট ও যাচাই', 'QR কোডসহ সনদ প্রিন্ট করুন, যে কেউ যাচাই করতে পারবে।']];
export default function Home() {
  return (
    <>
      <section className="hero"><div className="wrap hero-in">
        <div>
          <h1>নাগরিক সেবা হবে আরও সহজ, দ্রুত ও নির্ভুল</h1>
          <p>নাগরিকত্ব, চারিত্রিক, ওয়ারিশ ও ট্রেড লাইসেন্সসহ নানা সনদ এখন অনলাইনে। প্রতিটি সনদে QR কোড, তাই সত্যতা যাচাই মুহূর্তেই।</p>
          <a className="btn light" href="#services">সেবাসমূহ দেখুন</a> <a className="btn out" href="/register">নাগরিক নিবন্ধন</a>
        </div>
        <form className="card" action="/verify">
          <h2>ডিজিটাল সনদ যাচাই করুন</h2>
          <label htmlFor="no">সনদ নম্বর</label>
          <input id="no" name="no" required placeholder="সনদ নম্বর লিখুন" />
          <button className="btn" style={{ width: '100%' }}>যাচাই করুন</button>
        </form>
      </div></section>
      <section id="services" className="wrap sec">
        <h2>সনদ সেবা</h2>
        <div className="grid">{SERVICES.map((s) => <a key={s} className="svc" href={s === 'ওয়ারিশ সনদ' ? '/warish' : `/apply?service=${encodeURIComponent(s)}`}>{s}</a>)}</div>
      </section>
      <section className="wrap sec">
        <h2>কীভাবে কাজ করে</h2>
        <div className="grid">{STEPS.map(([t, d], i) => <div key={t} className="card"><b>{i + 1}. {t}</b><p style={{ margin: '6px 0 0', color: 'var(--mut)' }}>{d}</p></div>)}</div>
      </section>
    </>
  );
}
