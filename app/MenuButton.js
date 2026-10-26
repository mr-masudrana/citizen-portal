'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
// মোবাইলে হ্যামবার্গার মেনু: পেজ বদলালে, লিংকে চাপলে, Esc চাপলে বা স্ক্রিন বড় হলে বন্ধ হয়।
export default function MenuButton() {
  const [open, setOpen] = useState(false), path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const hdr = document.querySelector('.hdr');
    if (!hdr) return;
    hdr.dataset.open = open ? '1' : '0';
    document.body.style.overflow = open ? 'hidden' : '';
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    const click = (e) => { if (e.target.closest('nav a')) setOpen(false); };
    const size = () => { if (window.innerWidth > 900) setOpen(false); };
    document.addEventListener('keydown', esc); hdr.addEventListener('click', click); window.addEventListener('resize', size);
    return () => { document.removeEventListener('keydown', esc); hdr.removeEventListener('click', click); window.removeEventListener('resize', size); document.body.style.overflow = ''; };
  }, [open]);
  return <button type="button" className="menu-btn" aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'} onClick={() => setOpen((v) => !v)}><i /></button>;
}
