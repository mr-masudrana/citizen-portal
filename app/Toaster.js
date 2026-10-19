'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Icon } from '../lib/icons';
const IC = { ok: 'check', bad: 'alert', warn: 'info' };
let seq = 0;
function Toast({ t, onClose }) {
  useEffect(() => { const h = setTimeout(() => onClose(t.id), 6000); return () => clearTimeout(h); }, [t.id, onClose]);
  return (
    <div className={`toast ${t.type}`} role={t.type === 'bad' ? 'alert' : 'status'}>
      <span className="ti"><Icon n={IC[t.type]} size={16} /></span>
      <p>{t.text}</p>
      <button type="button" aria-label="বন্ধ করুন" onClick={() => onClose(t.id)}><Icon n="x" size={16} /></button>
      <i className="tb" />
    </div>
  );
}
// পেজে থাকা বার্তা (.page > p.badge) টোস্ট হিসেবে দেখায় এবং সাবমিট বাটনে লোডিং স্পিনার বসায়।
export default function Toaster() {
  const [items, setItems] = useState([]);
  const path = usePathname(), qs = useSearchParams().toString();
  const close = (id) => setItems((x) => x.filter((t) => t.id !== id));
  useEffect(() => {
    document.documentElement.classList.add('js');
    const h = setTimeout(() => {
      document.querySelectorAll('button.loading').forEach((b) => b.classList.remove('loading'));
      const found = [];
      document.querySelectorAll('.page > p.badge:not([data-t])').forEach((el) => {
        el.setAttribute('data-t', '1');
        const type = el.classList.contains('ok') ? 'ok' : el.classList.contains('bad') ? 'bad' : 'warn';
        found.push({ id: ++seq, type, text: el.textContent });
      });
      if (found.length) setItems((x) => [...x, ...found]);
    }, 60);
    return () => clearTimeout(h);
  }, [path, qs]);
  useEffect(() => {
    const on = (e) => {
      const b = e.submitter || e.target.querySelector('button:not([type=button])');
      if (!b) return;
      setTimeout(() => b.classList.add('loading'), 0);
      setTimeout(() => b.classList.remove('loading'), 10000);
    };
    document.addEventListener('submit', on);
    return () => document.removeEventListener('submit', on);
  }, []);
  return <div className="toasts no-print" aria-live="polite">{items.map((t) => <Toast key={t.id} t={t} onClose={close} />)}</div>;
}
