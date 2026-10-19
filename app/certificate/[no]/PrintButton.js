'use client';
export default function PrintButton({ applicationNo }) {
  return <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
    <a className="btn" href={`/certificate/${encodeURIComponent(applicationNo)}/pdf`}>সরাসরি PDF ডাউনলোড</a>
    <button className="btn out" onClick={() => window.print()}>প্রিন্ট / Save as PDF</button>
  </div>;
}
