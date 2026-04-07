const METRICS = [
  { key: 'weight', label: '体重', unit: 'kg', goodDir: -1 },
  { key: 'fat', label: '体脂肪率', unit: '%', goodDir: -1 },
  { key: 'muscle', label: '骨格筋量', unit: 'kg', goodDir: 1 },
  { key: 'visceral', label: '内臓脂肪', unit: '', goodDir: -1 },
  { key: 'bmr', label: '基礎代謝', unit: 'kcal', goodDir: 1 },
  { key: 'age', label: '体年齢', unit: '歳', goodDir: -1 },
];

export default function MetricCards({ data }) {
  if (!data.length) return null;
  const first = data[0];
  const latest = data[data.length - 1];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
      marginBottom: 24,
    }}>
      {METRICS.map(m => {
        const val = latest[m.key];
        const delta = +(val - first[m.key]).toFixed(1);
        const isGood = delta * m.goodDir < 0;
        const sign = delta > 0 ? '+' : '';
        return (
          <div key={m.key} style={{
            background: '#fff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '0.5px solid rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              {val.toFixed(m.unit === 'kcal' || m.unit === '' ? 0 : 1)}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 2 }}>{m.unit}</span>
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: delta === 0 ? '#888' : isGood ? '#1D9E75' : '#E24B4A' }}>
              {sign}{delta}{m.unit} (開始比)
            </div>
          </div>
        );
      })}
    </div>
  );
}
