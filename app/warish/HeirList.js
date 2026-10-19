'use client';
import { useState, useRef } from 'react';
const REL = ['পুত্র', 'কন্যা', 'স্ত্রী', 'স্বামী', 'পিতা', 'মাতা', 'ভাই', 'বোন'];
let k = 0;
const blank = () => ({ id: ++k });
export default function HeirList({ noun = 'ওয়ারিশ' }) {
  const [rows, setRows] = useState([blank(), blank()]);
  const drag = useRef(null);
  const move = (from, to) => { if (to < 0 || to >= rows.length || from === to) return; const a = [...rows]; const [m] = a.splice(from, 1); a.splice(to, 0, m); setRows(a); };
  return (
    <div>
      <p className="sub">ক্রম বদলাতে সারি টেনে আনুন অথবা ↑ ↓ বাটন চাপুন।</p>
      {rows.map((r, i) => (
        <div key={r.id} className="heir" draggable onDragStart={() => (drag.current = i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { move(drag.current, i); drag.current = null; }}>
          <span className="grip" aria-hidden="true">⋮⋮</span><b>{i + 1}.</b>
          <input name="h_name" aria-label={`${noun}ের নাম`} placeholder="নাম" required />
          <select name="h_rel" aria-label="সম্পর্ক">{REL.map((x) => <option key={x}>{x}</option>)}</select>
          <input name="h_nid" aria-label="NID / জন্ম নিবন্ধন নম্বর" placeholder="NID / জন্ম নিবন্ধন" />
          <button type="button" className="btn out sm" aria-label="উপরে নিন" onClick={() => move(i, i - 1)}>↑</button>
          <button type="button" className="btn out sm" aria-label="নিচে নিন" onClick={() => move(i, i + 1)}>↓</button>
          <button type="button" className="btn red sm" disabled={rows.length < 2} onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>মুছুন</button>
        </div>
      ))}
      <button type="button" className="btn out" onClick={() => setRows([...rows, blank()])}>{`+ ${noun} যোগ করুন`}</button>
    </div>
  );
}
