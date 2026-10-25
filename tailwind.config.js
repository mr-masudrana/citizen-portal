/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  // পুরোনো পেজগুলোর স্টাইল যেন না ভাঙে, তাই Tailwind-এর নিজস্ব রিসেট (preflight) বন্ধ। নতুন কম্পোনেন্ট ইউটিলিটি ক্লাস দিয়ে লেখা।
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: { 50: '#EAF5EF', 100: '#D3EBDD', 200: '#A9D6BC', 300: '#7FC09B', 400: '#3F9B6B', 500: '#0E7A4F', 600: '#0B5D3B', 700: '#094A2F', 800: '#073A25', 900: '#052A1B' },
        ink: '#14231B', muted: '#51625A', line: '#D9E2DB', surface: '#F4F7F5',
      },
      boxShadow: { soft: '0 1px 2px rgba(20,35,27,.06), 0 8px 24px rgba(20,35,27,.07)' },
      screens: { xs: '420px' },
    },
  },
  plugins: [],
};
