import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { fetchFromSheets } from "./utils/sheetsAPI";
import AIAdvice from "./components/AIAdvice";
import UploadButton from "./components/UploadButton";

const METRICS = [
  { key: "weight",   label: "体重",    unit: "kg",   color: "#60a5fa", desc: "総体重",         goodDir: -1 },
  { key: "fatPct",   label: "体脂肪率", unit: "%",   color: "#f97316", desc: "体脂肪の割合",   goodDir: -1 },
  { key: "fatKg",    label: "体脂肪量", unit: "kg",  color: "#fb923c", desc: "脂肪の重量",     goodDir: -1 },
  { key: "muscleKg", label: "骨格筋量", unit: "kg",  color: "#34d399", desc: "筋肉の重量",     goodDir:  1 },
  { key: "visceral", label: "内臓脂肪", unit: "Lv",  color: "#f43f5e", desc: "内臓脂肪レベル", goodDir: -1 },
  { key: "bmi",      label: "BMI",     unit: "",     color: "#a78bfa", desc: "ボディマス指数", goodDir: -1 },
  { key: "bodyAge",  label: "体年齢",  unit: "歳",   color: "#fbbf24", desc: "推定体年齢",     goodDir: -1 },
  { key: "bmr",      label: "基礎代謝", unit: "kcal", color: "#22d3ee", desc: "基礎代謝量",    goodDir:  1 },
];

function parseRows(rows) {
  return rows.slice(1).map(r => {
    const d = new Date(r[0]);
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const date = `${jst.getFullYear()}/${String(jst.getMonth()+1).padStart(2,'0')}/${String(jst.getDate()).padStart(2,'0')}`;
    const label = `${jst.getMonth()+1}/${jst.getDate()}`;
    const monthLabel = `${jst.getFullYear()}/${String(jst.getMonth()+1).padStart(2,'0')}`;
    const weight   = parseFloat(r[2]);
    const fatPct   = parseFloat(r[3]);
    const fatKg    = parseFloat(r[4]);
    const visceral = parseFloat(r[5]);
    const bmr      = parseFloat(r[6]);
    const musclePct = parseFloat(r[7]);
    const muscleKg = parseFloat(r[8]);
    const bmi      = parseFloat(r[9]);
    const bodyAge  = parseFloat(r[10]);
    if (isNaN(weight)) return null;
    return { date, label, monthLabel, weight, fatPct, fatKg, visceral, bmr, musclePct, muscleKg, bmi, bodyAge, leanMass: +(weight - fatKg).toFixed(1) };
  }).filter(Boolean);
}

function dedupByDate(data) {
  const map = {};
  data.forEach(d => { map[d.date] = d; });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function MonthlyBarChart({ data, metric }) {
  const monthly = useMemo(() => {
    const map = {};
    data.forEach(d => {
      if (!map[d.monthLabel]) map[d.monthLabel] = [];
      map[d.monthLabel].push(d[metric.key]);
    });
    return Object.entries(map).map(([month, vals]) => ({
      month: month.replace("2025/", "").replace("2026/", "'26/"),
      avg: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
    }));
  }, [data, metric.key]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${metric.color}`, borderRadius: 8 }} labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: metric.color }} formatter={(v) => [`${v} ${metric.unit}`, "月平均"]} />
        <Bar dataKey="avg" fill={metric.color} radius={[4, 4, 0, 0]} opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: `1px solid ${metric.color}33`, borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{ color: metric.color, fontWeight: 700, fontSize: 16 }}>{payload[0].value} {metric.unit}</div>
    </div>
  );
}

export default function App() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState(METRICS[0]);
  const [view, setView] = useState("trend");
  const [range, setRange] = useState(9999);

  useEffect(() => {
    fetchFromSheets()
      .then(rows => { setAllData(dedupByDate(parseRows(rows))); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const monthlyTable = useMemo(() => {
    const map = {};
    allData.forEach(d => { if (!map[d.monthLabel]) map[d.monthLabel] = []; map[d.monthLabel].push(d); });
    return Object.entries(map).map(([month, rows]) => {
      const avg = (key) => (rows.reduce((s, r) => s + r[key], 0) / rows.length).toFixed(1);
      return { month: month.replace("2025/", "").replace("2026/", "'26/"), weight: avg("weight"), fatPct: avg("fatPct"), muscleKg: avg("muscleKg"), visceral: avg("visceral"), bodyAge: avg("bodyAge") };
    });
  }, [allData]);

  if (loading) return <div style={{ minHeight: "100vh", background: "#060d1a", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>読み込み中...</div>;
  if (!allData.length) return <div style={{ minHeight: "100vh", background: "#060d1a", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>データがありません</div>;

  const first = allData[0];
  const last  = allData[allData.length - 1];
  const stats = METRICS.map(m => ({ ...m, start: first[m.key], end: last[m.key], diff: +(last[m.key] - first[m.key]).toFixed(1), min: +Math.min(...allData.map(d => d[m.key])).toFixed(1), max: +Math.max(...allData.map(d => d[m.key])).toFixed(1) }));
  const activeStats = stats.find(s => s.key === activeMetric.key);
  const filtered = range >= 9999 ? allData : (() => {
    const cutoff = new Date(last.date);
    cutoff.setDate(cutoff.getDate() - range);
    const cutoffStr = `${cutoff.getFullYear()}/${String(cutoff.getMonth()+1).padStart(2,'0')}/${String(cutoff.getDate()).padStart(2,'0')}`;
    return allData.filter(d => d.date >= cutoffStr);
  })();
  const trendData = filtered.length <= 40 ? filtered : filtered.filter((_, i) => i % 2 === 0 || i === filtered.length - 1);

  return (
    <div style={{ minHeight: "100vh", background: "#060d1a", color: "#e2e8f0", fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif", padding: "20px 16px", maxWidth: 700, margin: "0 auto" }}>

      {/* ヘッダー */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.15em", marginBottom: 4 }}>BODY COMPOSITION LOG</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>体組成ダッシュボード</h1>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{first.date} → {last.date}｜{allData.length} 回測定</div>
        </div>
        <UploadButton onUpload={(newRows) => setAllData(prev => dedupByDate([...prev, ...newRows]))} />
      </div>

      {/* ヒーロー統計 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "体重", value: `${last.weight} kg`, sub: `${first.weight} → ${last.weight} (${(last.weight - first.weight).toFixed(1)})`, color: "#60a5fa" },
          { label: "体脂肪量", value: `${last.fatKg} kg`, sub: `${first.fatKg} → ${last.fatKg} (${(last.fatKg - first.fatKg).toFixed(1)})`, color: "#f97316" },
          { label: "骨格筋量", value: `${last.muscleKg} kg`, sub: `${first.muscleKg} → ${last.muscleKg} (+${(last.muscleKg - first.muscleKg).toFixed(1)})`, color: "#34d399" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${s.color}22`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* メトリクス選択 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setActiveMetric(m)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${activeMetric.key === m.key ? m.color : "#1e293b"}`, background: activeMetric.key === m.key ? m.color + "22" : "transparent", color: activeMetric.key === m.key ? m.color : "#475569", fontSize: 12, cursor: "pointer", fontWeight: activeMetric.key === m.key ? 700 : 400, transition: "all 0.15s" }}>{m.label}</button>
        ))}
      </div>

      {/* ビュー切り替え */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["trend", "推移グラフ"], ["monthly", "月別棒グラフ"], ["summary", "全指標サマリー"]].map(([v, lbl]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: `1px solid ${view === v ? "#334155" : "#1e293b"}`, background: view === v ? "#1e293b" : "transparent", color: view === v ? "#e2e8f0" : "#475569" }}>{lbl}</button>
        ))}
      </div>

      {/* チャート */}
      <div style={{ background: "#0c1524", borderRadius: 16, padding: "20px 12px 10px", border: "1px solid #1e293b", marginBottom: 16 }}>
        {/* 期間選択 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, paddingLeft: 8 }}>
          {[[30,"30日"],[90,"90日"],[180,"180日"],[9999,"全期間"]].map(([v, lbl]) => (
            <button key={v} onClick={() => setRange(v)} style={{
              padding: "4px 12px", borderRadius: 999, fontSize: 11, border: "none", cursor: "pointer",
              background: range === v ? "#1e3a5f" : "transparent",
              color: range === v ? "#60a5fa" : "#475569",
            }}>{lbl}</button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingLeft: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: activeMetric.color, fontWeight: 700 }}>{activeMetric.label}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{activeMetric.desc}</div>
          </div>
          {view !== "summary" && activeStats && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: activeMetric.color }}>{activeStats.end}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>{activeMetric.unit}</span></div>
              <div style={{ fontSize: 10, color: "#475569" }}>{activeStats.start} → {activeStats.end}</div>
            </div>
          )}
        </div>

        {view === "trend" && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
              <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 10 }} interval={Math.floor(trendData.length / 6)} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip metric={activeMetric} />} />
              <Area type="monotone" dataKey={activeMetric.key} stroke={activeMetric.color} strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: activeMetric.color }} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {view === "monthly" && <MonthlyBarChart data={allData} metric={activeMetric} />}

        {view === "summary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
            {stats.map(s => {
              const pct = Math.abs(s.diff) / (Math.abs(s.max - s.min) || 1) * 100;
              const isGood = ["bmr", "musclePct", "muscleKg"].includes(s.key) ? s.diff >= 0 : s.diff <= 0;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 52, fontSize: 11, color: s.color, fontWeight: 600, flexShrink: 0 }}>{s.label}</div>
                  <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 3, opacity: 0.8 }} />
                  </div>
                  <div style={{ fontSize: 11, color: isGood ? "#34d399" : "#f43f5e", fontWeight: 700, width: 56, textAlign: "right" }}>{s.diff > 0 ? "+" : ""}{s.diff}{s.unit}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 体組成内訳 */}
      <div style={{ background: "#0c1524", borderRadius: 16, padding: 18, border: "1px solid #1e293b", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>最新の体組成内訳（{last.date}）</div>
        <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", gap: 2, marginBottom: 8 }}>
          <div style={{ width: `${(last.fatKg / last.weight * 100).toFixed(1)}%`, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{(last.fatKg / last.weight * 100).toFixed(0)}%</div>
          <div style={{ width: `${(last.muscleKg / last.weight * 100).toFixed(1)}%`, background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#064e3b", fontWeight: 700 }}>{(last.muscleKg / last.weight * 100).toFixed(0)}%</div>
          <div style={{ flex: 1, background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94a3b8" }}>その他</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[{ label: "脂肪", val: `${last.fatKg}kg`, color: "#f97316" }, { label: "筋肉", val: `${last.muscleKg}kg`, color: "#34d399" }, { label: "除脂肪体重", val: `${last.leanMass}kg`, color: "#60a5fa" }].map(i => (
            <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: i.color }} />
              <span style={{ color: "#64748b" }}>{i.label}</span>
              <span style={{ color: i.color, fontWeight: 700 }}>{i.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 月別テーブル */}
      <div style={{ background: "#0c1524", borderRadius: 16, padding: 18, border: "1px solid #1e293b", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>月別平均サマリー</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ color: "#475569" }}>
                {["月", "体重", "体脂肪%", "筋肉量", "内臓脂肪", "体年齢"].map(h => (
                  <th key={h} style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyTable.map(row => (
                <tr key={row.month} style={{ borderBottom: "1px solid #0f172a" }}>
                  <td style={{ padding: "6px 8px", color: "#94a3b8", fontWeight: 600 }}>{row.month}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#60a5fa" }}>{row.weight}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#f97316" }}>{row.fatPct}%</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#34d399" }}>{row.muscleKg}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#f43f5e" }}>{row.visceral}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#fbbf24" }}>{row.bodyAge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AIアドバイス */}
      <AIAdvice data={allData.map(d => ({ ...d, fat: d.fatPct, muscle: d.muscleKg, age: d.bodyAge }))} />

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "#1e293b" }}>
        HBF-228T · {allData.length} measurements
      </div>
    </div>
  );
}
