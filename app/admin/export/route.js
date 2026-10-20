import { isAdmin } from '../../../lib/admin';
import { listApps } from '../../../lib/db';
import { SERVICES } from '../../../lib/services';
const COLS = ['no', 'service', 'status', 'name_bn', 'name', 'father_bn', 'mother_bn', 'nid', 'mobile', 'division', 'district', 'upazila', 'union_name', 'village', 'ward', 'post', 'post_code', 'createdAt', 'decidedAt'];
const HEAD = ['আবেদন নম্বর', 'সনদ', 'অবস্থা', 'নাম (বাংলা)', 'নাম (ইংরেজি)', 'পিতা (বাংলা)', 'মাতা (বাংলা)', 'NID', 'মোবাইল', 'বিভাগ', 'জেলা', 'উপজেলা', 'ইউনিয়ন', 'গ্রাম', 'ওয়ার্ড', 'পোস্ট অফিস', 'পোস্ট কোড', 'আবেদনের সময়', 'সিদ্ধান্তের সময়'];
// =, +, -, @ দিয়ে শুরু হলে Excel সূত্র ভেবে চালিয়ে ফেলতে পারে, তাই আগে ' বসানো হয়
const cell = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
export async function GET(req) {
  if (!isAdmin()) return new Response('অনুমতি নেই', { status: 401 });
  const p = new URL(req.url).searchParams;
  const status = ['pending', 'approved', 'rejected'].includes(p.get('status')) ? p.get('status') : '', service = SERVICES.includes(p.get('service')) ? p.get('service') : '';
  const out = [HEAD.map(cell).join(',')];
  for (let page = 1; page <= 10; page++) {
    const { rows, total } = await listApps({ status, service, q: p.get('q'), page, size: 1000 });
    rows.forEach((r) => out.push(COLS.map((c) => cell(r[c])).join(',')));
    if (page * 1000 >= total) break;
  }
  return new Response('\uFEFF' + out.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="applications.csv"' } });
}
