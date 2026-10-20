'use client';
export default function SelectAll() {
  return <input type="checkbox" aria-label="সব নির্বাচন করুন" onChange={(e) => document.querySelectorAll('input[name=no]').forEach((c) => (c.checked = e.target.checked))} />;
}
