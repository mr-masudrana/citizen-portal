'use client';
export default function Error({ reset }) {
  return (
    <div className="page" style={{ textAlign: 'center', maxWidth: 520 }}>
      <h1>কিছু একটা ভুল হয়েছে</h1>
      <p className="sub">কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>
      <button className="btn" onClick={() => reset()}>আবার চেষ্টা করুন</button>
    </div>
  );
}
