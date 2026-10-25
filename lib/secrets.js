// দুর্বল বা উদাহরণের মান দিয়ে চালু হতে দেওয়া হয় না।
const WEAK = ['change-this', 'লম্বা-এলোমেলো', 'your-secret', 'secret-here', 'password'];
export const strong = (v, min = 32) => typeof v === 'string' && v.trim().length >= min && !WEAK.some((w) => v.toLowerCase().includes(w));
