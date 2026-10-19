import React from 'react';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { Document, Page, Text, View, Image, Font, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { currentCitizen } from '../../../../lib/auth';
import { get, getSettings, getActiveCertificateForApplication } from '../../../../lib/db';
import { bn } from '../../../../lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

Font.register({
  family: 'NotoBengali',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/NotoSansBengali-Regular.ttf'), fontWeight: 400 },
    { src: path.join(process.cwd(), 'public/fonts/NotoSansBengali-Bold.ttf'), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 32, paddingHorizontal: 38, fontFamily: 'NotoBengali', fontSize: 11, color: '#15251d', borderWidth: 5, borderColor: '#176b45' },
  top: { textAlign: 'center', borderBottomWidth: 1.5, borderBottomColor: '#176b45', paddingBottom: 12, marginBottom: 16 },
  government: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  union: { fontSize: 17, fontWeight: 700, marginBottom: 3 },
  qrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  qr: { width: 76, height: 76 },
  ref: { fontSize: 10, color: '#40554a', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 700, textAlign: 'center', marginVertical: 14, paddingBottom: 5 },
  body: { fontSize: 12, lineHeight: 1.9, textAlign: 'justify', marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 128, fontWeight: 700 },
  value: { flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e8f3ed', borderBottomWidth: 1, borderColor: '#8ca99a', padding: 6, fontWeight: 700 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#d4dfd8', padding: 6 },
  col1: { width: 34 }, col2: { flex: 2 }, col3: { flex: 1 }, col4: { flex: 1.5 },
  spacer: { flexGrow: 1, minHeight: 38 },
  signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  sign: { width: '42%', borderTopWidth: 1, borderColor: '#52665b', paddingTop: 5, textAlign: 'center', fontSize: 10 },
  footer: { marginTop: 20, borderTopWidth: 0.5, borderColor: '#a7b8ae', paddingTop: 8, fontSize: 8, color: '#52665b', textAlign: 'center' },
});

function CertificatePdf({ application: a, certificate: c, settings: s, site, qr }) {
  const extra = a.extra || null;
  const issued = bn(new Date(c.issued_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replaceAll('/', '-'));
  const address = [a.village && `গ্রাম/মহল্লা: ${a.village}`, a.ward && `ওয়ার্ড: ${bn(a.ward)}`, a.post && `ডাকঘর: ${a.post}`, a.upazila && `উপজেলা: ${a.upazila}`, a.district && `জেলা: ${a.district}`].filter(Boolean).join('। ');
  return React.createElement(Document, { title: `সনদ ${c.certificate_no}`, author: s.union_name || 'Citizen Portal', language: 'bn-BD' },
    React.createElement(Page, { size: 'A4', style: styles },
      React.createElement(View, { style: styles.top },
        React.createElement(Text, { style: styles.government }, 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'),
        React.createElement(Text, { style: styles.union }, s.union_name || process.env.UNION_NAME || 'ইউনিয়ন পরিষদ'),
        React.createElement(Text, null, `উপজেলা: ${s.upazila || process.env.UPAZILA || '—'} | জেলা: ${s.district || process.env.DISTRICT || '—'}`)
      ),
      React.createElement(View, { style: styles.qrRow },
        React.createElement(View, null,
          React.createElement(Text, { style: styles.ref }, `সনদ নম্বর: ${c.certificate_no}`),
          React.createElement(Text, { style: styles.ref }, `ইস্যুর তারিখ: ${issued}`),
          React.createElement(Text, { style: styles.ref }, `আবেদন নম্বর: ${a.no}`)
        ),
        React.createElement(View, { style: { alignItems: 'center' } },
          React.createElement(Image, { src: qr, style: styles.qr }),
          React.createElement(Text, { style: { fontSize: 8, marginTop: 3 } }, 'QR কোড দিয়ে যাচাই করুন')
        )
      ),
      React.createElement(Text, { style: styles.title }, a.service || 'প্রত্যয়নপত্র'),
      extra?.heirs?.length ? React.createElement(React.Fragment, null,
        React.createElement(Text, { style: styles.body }, `এই মর্মে প্রত্যয়ন করা যাইতেছে যে, মৃত ${extra.dname || '—'} (পিতা: ${extra.dfather || '—'}, মৃত্যুর তারিখ: ${extra.ddeath ? bn(extra.ddeath) : '—'}, মৃত্যু সনদ নং: ${bn(extra.dcert) || '—'}, ঠিকানা: ${extra.daddr || '—'})-এর ওয়ারিশগণের তালিকা নিম্নরূপ:`),
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: styles.col1 }, 'ক্রম'), React.createElement(Text, { style: styles.col2 }, 'নাম'), React.createElement(Text, { style: styles.col3 }, 'সম্পর্ক'), React.createElement(Text, { style: styles.col4 }, 'NID/জন্ম নিবন্ধন')
        ),
        ...extra.heirs.map((h, i) => React.createElement(View, { key: `${i}-${h.name}`, style: styles.tableRow },
          React.createElement(Text, { style: styles.col1 }, bn(i + 1)), React.createElement(Text, { style: styles.col2 }, h.name || '—'), React.createElement(Text, { style: styles.col3 }, h.rel || '—'), React.createElement(Text, { style: styles.col4 }, bn(h.nid) || '—')
        ))
      ) : React.createElement(React.Fragment, null,
        React.createElement(Text, { style: styles.body }, `এই মর্মে প্রত্যয়ন করা যাইতেছে যে, ${a.name || '—'}, এনআইডি/জন্ম নিবন্ধন নং: ${bn(a.nid) || '—'}, পিতা: ${a.father || '—'}, মাতা: ${a.mother || '—'}, জন্ম তারিখ: ${a.dob ? bn(a.dob.split('-').reverse().join('/')) : '—'}। স্থায়ী ঠিকানা: ${address || '—'}। আবেদনের তথ্য ও নথি পর্যালোচনা করে এই ${a.service || 'প্রত্যয়নপত্র'} প্রদান করা হলো।`),
        React.createElement(Text, { style: styles.body }, 'আমি তাহার উজ্জ্বল ভবিষ্যৎ ও সর্বাঙ্গীণ মঙ্গল কামনা করি।')
      ),
      React.createElement(View, { style: styles.spacer }),
      React.createElement(View, { style: styles.signatures },
        React.createElement(Text, { style: styles.sign }, 'সীল'),
        React.createElement(Text, { style: styles.sign }, 'অনুমোদনকারীর সীল ও স্বাক্ষর')
      ),
      React.createElement(Text, { style: styles.footer }, `সনদ যাচাই: ${site}/verify?no=${c.certificate_no} | এই PDF অনলাইন যাচাইয়ের বিকল্প নয়।`)
    )
  );
}

export async function GET(_request, { params }) {
  try {
    const user = await currentCitizen();
    if (!user) return NextResponse.json({ error: 'সনদ ডাউনলোড করতে লগইন করুন।' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    const applicationNo = String(params.no || '').trim();
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(applicationNo)) return NextResponse.json({ error: 'অবৈধ আবেদন নম্বর।' }, { status: 400 });
    const application = await get(applicationNo);
    if (!application || application.citizen_id !== user.id || application.status !== 'approved') return NextResponse.json({ error: 'এই সনদ দেখার অনুমতি নেই।' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const certificate = await getActiveCertificateForApplication(application.no);
    if (!certificate || certificate.status !== 'active') return NextResponse.json({ error: 'বৈধ সনদ পাওয়া যায়নি।' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const settings = await getSettings();
    const site = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const qr = await QRCode.toDataURL(`${site}/verify?no=${encodeURIComponent(certificate.certificate_no)}`, { margin: 1, width: 240 });
    const buffer = await renderToBuffer(React.createElement(CertificatePdf, { application, certificate, settings, site, qr }));
    return new Response(buffer, { status: 200, headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_no}.pdf"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) {
    console.error('Certificate PDF generation failed:', error?.message || error);
    return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। সার্ভার কনফিগারেশন ও বাংলা ফন্ট যাচাই করুন।' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
