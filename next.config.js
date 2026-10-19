module.exports = {
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
    serverComponentsExternalPackages: ['bwip-js', 'nodemailer'],
    // Vercel-এ public/seal.png ও signature.png সনদ পেজে পাওয়ার জন্য
    outputFileTracingIncludes: { '/certificate/[no]': ['./public/**/*'] },
  },
};
