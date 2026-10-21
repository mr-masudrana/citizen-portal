import { EXTRA, MEMBERS, HEIR } from './services';
const T = (v) => String(v ?? '').trim();
export function heirList(fd) {
  const names = fd.getAll('h_name'), rels = fd.getAll('h_rel'), nids = fd.getAll('h_nid');
  return names.map((n, i) => ({ name: T(n), rel: T(rels[i]), nid: T(nids[i]) })).filter((h) => h.name);
}
// সেবাভেদে অতিরিক্ত তথ্য (আয়, স্বামী/স্ত্রী, সদস্য, ওয়ারিশ ইত্যাদি)। ঠিক না থাকলে null।
export function parseExtra(fd, service) {
  const extra = {};
  for (const [k, , type] of EXTRA[service] || []) {
    const v = T(fd.get('x_' + k)).slice(0, 200);
    if (!v || (type === 'number' && !/^\d{1,10}$/.test(v))) return null;
    extra[k] = v;
  }
  if (MEMBERS.includes(service)) { extra.members = heirList(fd); if (!extra.members.length) return null; }
  if (HEIR.includes(service)) {
    const h = heirList(fd), g = (k) => T(fd.get(k)).slice(0, 120);
    if (!g('dname') || !h.length) return null;
    Object.assign(extra, { dname: g('dname'), dfather: g('dfather'), ddeath: g('ddeath'), dcert: g('dcert'), daddr: g('daddr'), heirs: h });
  }
  return extra;
}
