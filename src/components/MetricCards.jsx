const METRICS = [
  { key: 'weight',   label: '体重',    unit: 'kg',   goodDir: -1, color: '#60a5fa' },
  { key: 'fat',      label: '体脂肪率', unit: '%',   goodDir: -1, color: '#f97316' },
  { key: 'muscle',   label: '骨格筋量', unit: 'kg',  goodDir:  1, color: '#34d399' },
  { key: 'visceral', label: '内臓脂肪', unit: '',    goodDir: -1, color: '#f43f5e' },
  { key: 'bmr',      label: '基礎代謝', unit: 'kcal', goodDir: 1, color: '#a78bfa' },
  { key: 'age',      label: '体年齢',   unit: '歳',  goodDir: -1, color: '#fbbf24' },
];

export default function MetricCards({ data }) {
  if (!data.length) return null;
  const first = data[0];
  const latest = data[data.length - 1];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
      marginBottom: 20,
    }}>
      {METRICS.map(m => {
        const val = latest[m.key];
        const delta = +(val - first[m.key]).toFixed(1);
        const isGood = delta * m.goodDir < 0;
        const sign = delta > 0 ? '+' : '';
        const fmt = m.unit === 'kcal' || m.unit === '' ? 0 : 1;
        return (
          <div key={m.key} style={{
            background: '#0c1524',
            borderRadius: 14,
            padding: '14px 16px',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6, letterSpacing: '0.03em' }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>
              {val.toFixed(fmt)}
              <span style={{ fontSize: 11, fontWeight: 400, color: '#475569', marginLeft: 3 }}>{m.unit}</span>
            </div>
            <div style={{
              fontSize: 11, marginTop: 6,
              color: delta === 0 ? '#475569' : isGood ? '#34d399' : '#f43f5e',
              fontWeight: 600,
            }}>
              {sign}{delta}{m.unit}
              <span style={{ color: '#334155', fontWeight: 400, marginLeft: 4 }}>開始比</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
