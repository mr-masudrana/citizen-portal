// বাংলা QR = EMVCo মার্চেন্ট-প্রেজেন্টেড QR। অ্যাডমিনের QR-এর লেখা (payload) থেকে পরিমাণসহ QR বানায়।
export function crc16(str) {
  let c = 0xffff;
  for (const x of Buffer.from(str, 'utf8')) { c ^= x << 8; for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; }
  return c.toString(16).toUpperCase().padStart(4, '0');
}
export function parseTLV(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const tag = s.slice(i, i + 2), l = s.slice(i + 2, i + 4), len = Number(l);
    if (!/^\d\d$/.test(tag) || !/^\d\d$/.test(l) || i + 4 + len > s.length) throw new Error('QR-এর লেখা ঠিক নেই');
    out.push([tag, s.slice(i + 4, i + 4 + len)]); i += 4 + len;
  }
  return out;
}
const enc = (t) => t.map(([k, v]) => k + String(v.length).padStart(2, '0') + v).join('');
// EMV ধাঁচের এবং শেষের CRC ঠিক কি না
export function validPayload(p) {
  try {
    const s = String(p).trim(), t = parseTLV(s);
    return t[0]?.[0] === '00' && t[t.length - 1][0] === '63' && crc16(s.slice(0, -4)) === s.slice(-4).toUpperCase();
  } catch { return false; }
}
// স্থির QR-কে "গতিশীল" করে পরিমাণ বসায় (ট্যাগ ০১ = ১২, ট্যাগ ৫৪ = পরিমাণ) এবং CRC নতুন করে হিসাব করে
export function dynamicQR(payload, amount) {
  const t = parseTLV(String(payload).trim()).filter(([k]) => k !== '63' && k !== '54' && k !== '01');
  t.push(['01', '12'], ['54', Number(amount).toFixed(2)]);
  t.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const body = enc(t) + '6304';
  return body + crc16(body);
}
