import { useEffect, useRef, useState } from 'react';

const METRIC_OPTIONS = [
  { value: 'weight', label: '体重 (kg)', color: '#178acc' },
  { value: 'fat', label: '体脂肪率 (%)', color: '#E24B4A' },
  { value: 'fatMass', label: '体脂肪量 (kg)', color: '#f97316' },
  { value: 'muscle', label: '骨格筋量 (kg)', color: '#1D9E75' },
  { value: 'visceral', label: '内臓脂肪レベル', color: '#EF9F27' },
  { value: 'bmr', label: '基礎代謝 (kcal)', color: '#7F77DD' },
  { value: 'age', label: '体年齢', color: '#888780' },
];

const RANGE_OPTIONS = [
  { value: 30, label: '30日' },
  { value: 90, label: '90日' },
  { value: 180, label: '180日' },
  { value: 9999, label: '全期間' },
];

export default function BodyChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [metric, setMetric] = useState('weight');
  const [range, setRange] = useState(180);

  useEffect(() => {
    if (!data.length) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const filtered = range >= 9999 ? data : (() => {
        const cutoff = new Date(data[data.length - 1].date);
        cutoff.setDate(cutoff.getDate() - range);
        return data.filter(r => r.date >= cutoff);
      })();
      const m = METRIC_OPTIONS.find(o => o.value === metric);
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: filtered.map(r => r.dateLabel.slice(0, 10)),
          datasets: [{
            label: m.label,
            data: filtered.map(r => r[metric]),
            borderColor: m.color,
            backgroundColor: m.color + '18',
            borderWidth: 2,
            pointRadius: filtered.length > 60 ? 0 : 3,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { maxTicksLimit: 8, maxRotation: 30, font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
          },
        },
      });
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data, metric, range]);

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={metric} onChange={e => setMetric(e.target.value)}
          style={{ fontSize: 13, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #ccc', background: '#fff' }}>
          {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={range} onChange={e => setRange(+e.target.value)}
          style={{ fontSize: 13, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #ccc', background: '#fff' }}>
          {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ position: 'relative', height: 260 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
