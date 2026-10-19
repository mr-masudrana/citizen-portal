const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
}

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
    serverComponentsExternalPackages: ['bwip-js'],
    // Vercel-এ সনদ PDF-এ বাংলা ফন্ট পাওয়ার জন্য public assets include করা হয়।
    outputFileTracingIncludes: { '/certificate/[no]': ['./public/**/*'] },
  },
};
