import { useState } from 'react';

export default function AIAdvice({ data }) {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  async function getAdvice() {
    if (!data.length) return;
    setLoading(true);

    const first = data[0];
    const latest = data[data.length - 1];
    const days = Math.round((new Date(latest.date) - new Date(first.date)) / 86400000);

    const recent = data.slice(-7);
    const recentFirst = recent[0];

    const totalMuscleChange = (latest.muscleKg - first.muscleKg).toFixed(1);
    const totalFatChange = (first.fatKg - latest.fatKg).toFixed(1);
    const totalWeightChange = (first.weight - latest.weight).toFixed(1);

    const recentWeightChange = (recentFirst.weight - latest.weight).toFixed(1);
    const recentMuscleChangeNum = Number((latest.muscleKg - recentFirst.muscleKg).toFixed(1));
    const recentFatChangeNum = Number((recentFirst.fatKg - latest.fatKg).toFixed(1));

    const recentMuscleNote = Math.abs(recentMuscleChangeNum) <= 0.5
      ? '変化なし（誤差範囲）'
      : `${recentMuscleChangeNum >= 0 ? '+' : ''}${recentMuscleChangeNum}kg`;
    const recentFatNote = Math.abs(recentFatChangeNum) <= 0.5
      ? '変化なし（誤差範囲）'
      : `${recentFatChangeNum >= 0 ? '-' : '+'}${Math.abs(recentFatChangeNum)}kg`;

    const prompt = `あなたは体組成データを分析するフィットネスアドバイザーです。
出力はプレーンテキストのみで、マークダウン記号（**や##など）は一切使わないこと。

【全期間サマリー】${days}日間（${first.date}〜${latest.date}）
開始時: 体重${first.weight}kg / 体脂肪量${first.fatKg}kg / 骨格筋量${first.muscleKg}kg / 内臓脂肪Lv${first.visceral} / 体年齢${first.bodyAge}歳
現在:   体重${latest.weight}kg / 体脂肪量${latest.fatKg}kg / 骨格筋量${latest.muscleKg}kg / 内臓脂肪Lv${latest.visceral} / 体年齢${latest.bodyAge}歳
全期間変化: 体重-${totalWeightChange}kg / 体脂肪量-${totalFatChange}kg / 骨格筋量${Number(totalMuscleChange) >= 0 ? '+' : ''}${totalMuscleChange}kg

【直近7計測のトレンド】${recentFirst.date}〜${latest.date}
体重: ${recentFirst.weight}kg → ${latest.weight}kg（${Number(recentWeightChange) >= 0 ? '-' : '+'}${Math.abs(recentWeightChange)}kg）
体脂肪量: ${recentFirst.fatKg}kg → ${latest.fatKg}kg（${recentFatNote}）
骨格筋量: ${recentFirst.muscleKg}kg → ${latest.muscleKg}kg（${recentMuscleNote}）

目標: 体重73kg（残り${(latest.weight - 73).toFixed(1)}kg）

【分析の注意事項】
- 「変化なし（誤差範囲）」と記載された項目はポジティブ・ネガティブどちらの評価もしないこと
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
    <div style={{ background: '#0c1524', borderRadius: 16, padding: '20px', border: '1px solid #1e293b', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#1e3a5f', color: '#60a5fa', fontWeight: 500 }}>AI アドバイス</span>
      </div>
      <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, minHeight: 60 }}>
        {loading ? '分析中...' : advice || 'ボタンを押すとAIがデータを分析します。'}
      </div>
      {data.length > 0 && (
        <button onClick={getAdvice} disabled={loading}
          style={{ marginTop: 14, padding: '7px 16px', fontSize: 13, borderRadius: 8, border: '1px solid #1e293b', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>
          {loading ? '分析中...' : advice ? '再分析' : '分析する'}
        </button>
      )}
    </div>
  );
}
