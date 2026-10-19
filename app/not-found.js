import { Icon } from '../lib/icons';
export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center', maxWidth: 520 }}>
      <div className="ic" style={{ margin: '0 auto 16px', width: 64, height: 64, borderRadius: 18 }}><Icon n="search" size={30} /></div>
      <h1>পেজটি পাওয়া যায়নি</h1>
      <p className="sub">লিংকটি ভুল, অথবা সনদটি আপনার জন্য খোলা নয়।</p>
      <a className="btn" href="/">হোমে ফিরে যান</a>
    </div>
  );
}
