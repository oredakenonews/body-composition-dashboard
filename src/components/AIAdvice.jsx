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

    // 直近の測定間隔を計算（日数）
    const recentIntervals = recent.slice(1).map((r, i) => {
      const diff = (new Date(r.date) - new Date(recent[i].date)) / 86400000;
      return Math.round(diff);
    });
    const avgInterval = recentIntervals.length
      ? (recentIntervals.reduce((s, v) => s + v, 0) / recentIntervals.length).toFixed(1)
      : 1;
    const maxInterval = recentIntervals.length ? Math.max(...recentIntervals) : 1;
    const hasRestPeriod = maxInterval >= 4;

    const prompt = `あなたは体組成データを分析するフィットネスアドバイザーです。
出力はプレーンテキストのみで、マークダウン記号（**や##など）は一切使わないこと。

【全期間サマリー】${days}日間（${first.date}〜${latest.date}）
開始時: 体重${first.weight}kg / 体脂肪量${first.fatKg}kg / 骨格筋量${first.muscleKg}kg / 内臓脂肪Lv${first.visceral} / 体年齢${first.bodyAge}歳
現在:   体重${latest.weight}kg / 体脂肪量${latest.fatKg}kg / 骨格筋量${latest.muscleKg}kg / 内臓脂肪Lv${latest.visceral} / 体年齢${latest.bodyAge}歳
全期間変化: 体重-${totalWeightChange}kg / 体脂肪量-${totalFatChange}kg / 骨格筋量${Number(totalMuscleChange) >= 0 ? '+' : ''}${totalMuscleChange}kg

【直近7計測のトレンド】${recentFirst.date}〜${latest.date}
体重: ${recentFirst.weight}kg → ${latest.weight}kg
体脂肪量: ${recentFirst.fatKg}kg → ${latest.fatKg}kg
骨格筋量: ${recentFirst.muscleKg}kg → ${latest.muscleKg}kg
平均測定間隔: ${avgInterval}日 / 最大間隔: ${maxInterval}日${hasRestPeriod ? '（休養期間あり）' : ''}

目標: 体重73kg（残り${(latest.weight - 73).toFixed(1)}kg）、筋肉は現状維持〜微増を狙っている

【分析の注意事項】
- 直近に4日以上の測定空白がある場合は「休養明け」として扱い、その前後の数値変動は誤差として評価しないこと
- 体組成の数値は日々ブレがあるため、短期の小幅な変動（±0.5kg程度）はトレンドとして評価しないこと
- 全期間のトレンドを軸に、直近の状態をさらっと添える程度にすること
- 淡々と事実ベースで、過剰な心配や褒めは不要

3文以内のプレーンテキストで述べてください。`;

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
