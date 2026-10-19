export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="লোড হচ্ছে">
      <div className="sk" style={{ height: 36, width: '40%' }} />
      <div className="sk" style={{ height: 18, width: '60%', marginTop: 12 }} />
      <div className="grid" style={{ marginTop: 24 }}>{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="sk" style={{ height: 76, borderRadius: 12 }} />)}</div>
    </div>
  );
}
