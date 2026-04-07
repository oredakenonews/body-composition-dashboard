import { useState } from 'react';

export default function AIAdvice({ data }) {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  async function getAdvice() {
    if (!data.length) return;
    setLoading(true);

    const first = data[0];
    const latest = data[data.length - 1];
    const days = Math.round((latest.date - first.date) / 86400000);

    // 直近7計測のトレンド
    const recent = data.slice(-7);
    const recentFirst = recent[0];

    // 骨格筋量の変化（全期間・直近）
    const totalMuscleChange = (latest.muscle - first.muscle).toFixed(1);
    const recentMuscleChange = (latest.muscle - recentFirst.muscle).toFixed(1);
    const totalFatChange = (first.fatMass - latest.fatMass).toFixed(1);
    const recentFatChange = (recentFirst.fatMass - latest.fatMass).toFixed(1);
    const totalWeightChange = (first.weight - latest.weight).toFixed(1);
    const recentWeightChange = (recentFirst.weight - latest.weight).toFixed(1);

    const prompt = `あなたは体組成データを分析するフィットネスアドバイザーです。
出力はプレーンテキストのみで、マークダウン記号（**や##など）は一切使わないこと。

【全期間サマリー】${days}日間（${first.dateLabel.slice(0, 10)}〜${latest.dateLabel.slice(0, 10)}）
開始時: 体重${first.weight}kg / 体脂肪量${first.fatMass}kg / 骨格筋量${first.muscle}kg / 内臓脂肪Lv${first.visceral} / 体年齢${first.age}歳
現在:   体重${latest.weight}kg / 体脂肪量${latest.fatMass}kg / 骨格筋量${latest.muscle}kg / 内臓脂肪Lv${latest.visceral} / 体年齢${latest.age}歳
全期間変化: 体重-${totalWeightChange}kg / 体脂肪量-${totalFatChange}kg / 骨格筋量${Number(totalMuscleChange) >= 0 ? '+' : ''}${totalMuscleChange}kg

【直近7計測のトレンド】${recentFirst.dateLabel.slice(0, 10)}〜${latest.dateLabel.slice(0, 10)}
体重: ${recentFirst.weight}kg → ${latest.weight}kg（${Number(recentWeightChange) >= 0 ? '-' : '+'}${Math.abs(recentWeightChange)}kg）
体脂肪量: ${recentFirst.fatMass}kg → ${latest.fatMass}kg（${Number(recentFatChange) >= 0 ? '-' : '+'}${Math.abs(recentFatChange)}kg）
骨格筋量: ${recentFirst.muscle}kg → ${latest.muscle}kg（${Number(recentMuscleChange) >= 0 ? '+' : ''}${recentMuscleChange}kg）

目標: 体重73kg（残り${(latest.weight - 73).toFixed(1)}kg）

【分析の注意事項】
- 骨格筋量の変化が±0.5kg以内は体組成計の誤差範囲のため「変化なし」として扱い、減少と断言しないこと
- 全期間と直近トレンドを明確に区別して評価すること
- 直近トレンドを優先してコンディションを判断すること

以下の順番で3〜4文のプレーンテキストで述べてください:
①直近の調子（直近7計測のトレンドから）
②全体の進捗評価
③一言アドバイス`;

    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
