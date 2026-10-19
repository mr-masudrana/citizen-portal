'use client';
export default function PrintButton() {
  return <button className="btn no-print" onClick={() => window.print()}>প্রিন্ট করুন</button>;
}
