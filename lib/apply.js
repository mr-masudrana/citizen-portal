import { EXTRA, MEMBERS, HEIR } from './services';
const T = (v) => String(v ?? '').trim();
const NID = /^\d{10,17}$/;
const en = (s) => s.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)); // বাংলা অঙ্ক → ইংরেজি অঙ্ক
// সদস্য/ওয়ারিশের তালিকা। সংখ্যা ৪০-এর বেশি বা NID ভুল হলে null।
export function heirList(fd) {
  const names = fd.getAll('h_name'), rels = fd.getAll('h_rel'), nids = fd.getAll('h_nid');
  const list = names.map((n, i) => ({ name: T(n).slice(0, 120), rel: T(rels[i]).slice(0, 40), nid: en(T(nids[i])).slice(0, 17) })).filter((h) => h.name);
  if (list.length > 40 || list.some((h) => h.nid && !NID.test(h.nid))) return null;
  return list;
}
// সেবাভেদে অতিরিক্ত তথ্য (আয়, স্বামী/স্ত্রী, সদস্য, ওয়ারিশ ইত্যাদি)। ঠিক না থাকলে null।
export function parseExtra(fd, service) {
  const extra = {};
  for (const [k, , type] of EXTRA[service] || []) {
    const v = T(fd.get('x_' + k)).slice(0, 200);
    if (!v || (type === 'number' && !/^\d{1,10}$/.test(v))) return null;
    extra[k] = v;
  }
  if (MEMBERS.includes(service)) { const m = heirList(fd); if (!m?.length) return null; extra.members = m; }
  if (HEIR.includes(service)) {
    const h = heirList(fd), g = (k) => T(fd.get(k)).slice(0, 120);
    if (!g('dname') || !h?.length) return null;
    const ddeath = g('ddeath'), dcert = g('dcert');
    if (ddeath && (!/^\d{4}-\d{2}-\d{2}$/.test(ddeath) || new Date(ddeath) > new Date())) return null;
    if (dcert && !/^[\p{L}\p{M}\p{N}\-\/ ]{1,40}$/u.test(dcert)) return null;
    Object.assign(extra, { dname: g('dname'), dfather: g('dfather'), ddeath, dcert, daddr: g('daddr'), heirs: h });
  }
  return extra;
}
