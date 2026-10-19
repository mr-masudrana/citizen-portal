'use client';
import { useState } from 'react';
export default function PhotoPick({ current }) {
  const [src, setSrc] = useState(current || null);
  const [err, setErr] = useState('');
  const pick = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type) || f.size > 1048576) { setErr('ছবি JPG বা PNG এবং ১ MB-এর মধ্যে হতে হবে।'); e.target.value = ''; return; }
    setErr(''); setSrc(URL.createObjectURL(f));
  };
  return (
    <div className="photo">
      <div className="ph">{src ? <img src={src} alt="আপনার ছবি" /> : <span>ছবি নেই</span>}</div>
      <div style={{ flex: '1 1 240px' }}>
        <label htmlFor="photo" style={{ marginTop: 0 }}>পাসপোর্ট সাইজ ছবি</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png" onChange={pick} />
        <p className="sub" style={{ margin: '6px 0 0', fontSize: 14 }}>JPG বা PNG, সর্বোচ্চ ১ MB। মুখ পরিষ্কার দেখা যায় এমন ছবি দিন।</p>
        {err && <p className="badge bad" style={{ marginTop: 8 }}>{err}</p>}
      </div>
    </div>
  );
}
