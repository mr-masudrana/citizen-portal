import { divisions, districts, upazillas, unions } from 'bd-geojs';
const by = (a, id) => a.find((x) => String(x.id) === String(id));
// নির্বাচিত আইডি যাচাই করে বাংলা নাম ফেরত দেয়। ভুল বা অসম্পূর্ণ হলে যতটুকু ঠিক ততটুকু।
export function fromIds(dv, di, up, un) {
  const r = { division: '', district: '', upazila: '', union_name: '' };
  const a = by(divisions, dv); if (!a) return r; r.division = a.bn_name;
  const b = by(districts, di); if (!b || String(b.division_id) !== String(a.id)) return r; r.district = b.bn_name;
  const c = by(upazillas, up); if (!c || String(c.district_id) !== String(b.id)) return r; r.upazila = c.bn_name;
  const d = un && un !== '__other' && by(unions, un);
  if (d && String(d.upazilla_id) === String(c.id)) r.union_name = d.bn_name;
  return r;
}
// সংরক্ষিত নাম থেকে আইডি বের করে, যাতে প্রোফাইলে আগের নির্বাচন দেখা যায়।
export function toIds(u) {
  const a = divisions.find((x) => x.bn_name === u.division);
  const b = a && districts.find((x) => x.bn_name === u.district && String(x.division_id) === String(a.id));
  const c = b && upazillas.find((x) => x.bn_name === u.upazila && String(x.district_id) === String(b.id));
  const d = c && unions.find((x) => x.bn_name === u.union_name && String(x.upazilla_id) === String(c.id));
  return { division: a ? String(a.id) : '', district: b ? String(b.id) : '', upazila: c ? String(c.id) : '', union: d ? String(d.id) : u.union_name ? '__other' : '' };
}
const T = { districts: [districts, 'division_id'], upazilas: [upazillas, 'district_id'], unions: [unions, 'upazilla_id'] };
export function list(level, parent) {
  const rows = level === 'divisions' ? divisions : T[level] ? T[level][0].filter((x) => String(x[T[level][1]]) === parent) : [];
  return rows.map((x) => ({ id: String(x.id), n: x.bn_name })).sort((a, b) => a.n.localeCompare(b.n, 'bn'));
}
