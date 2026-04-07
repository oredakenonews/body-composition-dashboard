import { useEffect, useState } from 'react';
import { fetchFromSheets } from './utils/sheetsAPI';
import { dedup } from './utils/parseCSV';
import MetricCards from './components/MetricCards';
import BodyChart from './components/BodyChart';
import AIAdvice from './components/AIAdvice';
import UploadButton from './components/UploadButton';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromSheets().then(rows => {
      const parsed = rows.map(r => ({
        dateLabel: r[0],
        date: new Date(r[0].replace(/\//g, '-').replace(' ', 'T')),
        raw: r,
        weight: parseFloat(r[2]),
        fat: parseFloat(r[3]),
        fatMass: parseFloat(r[4]),
        visceral: parseFloat(r[5]),
        bmr: parseFloat(r[6]),
        musclePct: parseFloat(r[7]),
        muscle: parseFloat(r[8]),
        bmi: parseFloat(r[9]),
        age: parseFloat(r[10]),
      })).filter(r => !isNaN(r.weight));
      parsed.sort((a, b) => a.date - b.date);
      setData(dedup(parsed));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleUpload(newRows) {
    setData(prev => dedup([...prev, ...newRows].sort((a, b) => a.date - b.date)));
  }

  const dateRange = data.length
    ? `${data[0].dateLabel.slice(0,10)} 〜 ${data[data.length-1].dateLabel.slice(0,10)}（${data.length}件）`
    : '';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>体組成ダッシュボード</h1>
          <p style={{ fontSize: 13, color: '#888' }}>{loading ? '読み込み中...' : dateRange}</p>
        </div>
        <UploadButton onUpload={handleUpload} />
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>読み込み中...</div>
      ) : (
        <>
          <MetricCards data={data} />
          <BodyChart data={data} />
          <AIAdvice data={data} />
        </>
      )}
    </div>
  );
}
