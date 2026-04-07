import { useState } from 'react';

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function AIAdvice({ data }) {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  async function getAdvice() {
    if (!data.length) return;
    setLoading(true);
    const first = data[0];
    const latest = data[data.length - 1];
    const days = Math.round((latest.date - first.date) / 86400000);

    const prompt = `以下はオムロン体組成計の実データです（日本語で簡潔に）:
期間: ${days}日間 (${first.dateLabel.slice(0,10)}〜${latest.dateLabel.slice(0,10)})
開始時: 体重${first.weight}kg 体脂肪${first.fat}% 骨格筋量${first.muscle}kg 内臓脂肪Lv${first.visceral} 体年齢${first.age}歳
現在: 体重${latest.weight}kg 体脂肪${latest.fat}% 骨格筋量${latest.muscle}kg 内臓脂肪Lv${latest.visceral} 体年齢${latest.age}歳
変化: 体重-${(first.weight - latest.weight).toFixed(1)}kg 体脂肪量-${(first.fatMass - latest.fatMass).toFixed(1)}kg
目標: 体重73kg

この人のデータを分析して、①進捗の評価、②気になるポイント、③今後のアドバイス を3〜5文で述べてください。`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const d = await res.json();
      setAdvice(d.content?.[0]?.text || 'エラーが発生しました。');
    } catch {
      setAdvice('エラーが発生しました。');
    }
    setLoading(false);
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#e8f4fd', color: '#178acc', fontWeight: 500 }}>AI アドバイス</span>
      </div>
      <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7, minHeight: 60 }}>
        {loading ? '分析中...' : advice || 'ボタンを押すとAIがデータを分析します。'}
      </div>
      {data.length > 0 && (
        <button onClick={getAdvice} disabled={loading}
          style={{ marginTop: 14, padding: '7px 16px', fontSize: 13, borderRadius: 8, border: '0.5px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          {loading ? '分析中...' : advice ? '再分析' : '分析する'}
        </button>
      )}
    </div>
  );
}
