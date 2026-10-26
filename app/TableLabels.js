'use client';
import { useEffect } from 'react';
// ছোট স্ক্রিনে টেবিল কার্ড-তালিকা হয়। প্রতিটি ঘরের পাশে কলামের নাম বসাতে th-এর লেখা data-label-এ কপি করা হয়।
export default function TableLabels() {
  useEffect(() => {
    let raf = 0;
    const run = () => {
      document.querySelectorAll('.tbl table').forEach((t) => {
        const h = [...t.querySelectorAll('thead th')].map((x) => x.textContent.trim());
        t.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (h[i] && td.dataset.label !== h[i]) td.dataset.label = h[i]; }));
      });
    };
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); });
    run(); mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
