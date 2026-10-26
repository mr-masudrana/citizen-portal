'use client';
import { useState } from 'react';
import { Icon } from '../lib/icons';
// সেবার তালিকা ও খোঁজার ঘর। ১৭টি সেবার মধ্যে দ্রুত বেছে নেওয়ার জন্য।
export default function ServiceGrid({ items }) {
  const [q, setQ] = useState('');
  const list = items.filter((s) => s.name.includes(q.trim()));
  return (
    <>
      <div style={{ maxWidth: 420, marginBottom: 18 }}>
        <label htmlFor="svc-q" className="sr">সেবা খুঁজুন</label>
        <input id="svc-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="সেবা খুঁজুন, যেমন: আয়ের সনদ" autoComplete="off" />
      </div>
      <div className="grid">
        {list.map((s) => (
          <a key={s.name} className="svc" href={`/apply?service=${encodeURIComponent(s.name)}`}>
            <span className="ic"><Icon n={s.icon} /></span><span className="svc-t">{s.name}</span><Icon n="arrow" size={16} className="go" />
          </a>
        ))}
      </div>
      {list.length === 0 && <p className="sub" style={{ marginTop: 12 }}>“{q}” নামে কোনো সেবা নেই। অন্য শব্দ লিখে দেখুন।</p>}
    </>
  );
}
