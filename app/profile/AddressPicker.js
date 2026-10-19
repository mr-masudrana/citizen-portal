'use client';
import { useEffect, useState } from 'react';
const load = (level, parent = '') => fetch(`/api/geo?level=${level}&parent=${parent}`).then((r) => r.json()).catch(() => []);
const Sel = ({ l, n, val, opts, on, off, extra }) => (
  <div>
    <label htmlFor={n}>{l}</label>
    <select id={n} name={n} value={val} onChange={(e) => on(e.target.value)} disabled={off}>
      <option value="">— নির্বাচন করুন —</option>
      {opts.map((x) => <option key={x.id} value={x.id}>{x.n}</option>)}
      {extra}
    </select>
  </div>
);
export default function AddressPicker({ init, other }) {
  const [v, setV] = useState(init);
  const [o, setO] = useState({ division: [], district: [], upazila: [], union: [] });
  const put = (k, x) => setO((p) => ({ ...p, [k]: x }));
  useEffect(() => { load('divisions').then((x) => put('division', x)); }, []);
  useEffect(() => { v.division ? load('districts', v.division).then((x) => put('district', x)) : put('district', []); }, [v.division]);
  useEffect(() => { v.district ? load('upazilas', v.district).then((x) => put('upazila', x)) : put('upazila', []); }, [v.district]);
  useEffect(() => { v.upazila ? load('unions', v.upazila).then((x) => put('union', x)) : put('union', []); }, [v.upazila]);
  const order = ['division', 'district', 'upazila', 'union'];
  const set = (k, val) => setV((p) => { const n = { ...p, [k]: val }; order.slice(order.indexOf(k) + 1).forEach((x) => (n[x] = '')); return n; });
  return (
    <>
      <Sel l="বিভাগ" n="division" val={v.division} opts={o.division} on={(x) => set('division', x)} />
      <Sel l="জেলা" n="district" val={v.district} opts={o.district} on={(x) => set('district', x)} off={!v.division} />
      <Sel l="উপজেলা" n="upazila" val={v.upazila} opts={o.upazila} on={(x) => set('upazila', x)} off={!v.district} />
      <Sel l="ইউনিয়ন" n="union" val={v.union} opts={o.union} on={(x) => set('union', x)} off={!v.upazila} extra={<option value="__other">তালিকায় নেই / অন্যান্য</option>} />
      {v.union === '__other' && (
        <div><label htmlFor="union_other">ইউনিয়নের নাম লিখুন</label><input id="union_other" name="union_other" defaultValue={other || ''} /></div>
      )}
    </>
  );
}
