export function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 11) continue;
    const dateStr = cols[0].replace(/\//g, '-').replace(' ', 'T');
    const d = new Date(dateStr);
    if (isNaN(d)) continue;
    rows.push({
      dateLabel: cols[0],
      date: d,
      raw: cols,
      weight: parseFloat(cols[2]),
      fat: parseFloat(cols[3]),
      fatMass: parseFloat(cols[4]),
      visceral: parseFloat(cols[5]),
      bmr: parseFloat(cols[6]),
      musclePct: parseFloat(cols[7]),
      muscle: parseFloat(cols[8]),
      bmi: parseFloat(cols[9]),
      age: parseFloat(cols[10]),
    });
  }
  rows.sort((a, b) => a.date - b.date);
  return rows;
}

export function dedup(rows) {
  const seen = new Set();
  return rows.filter(r => {
    if (seen.has(r.dateLabel)) return false;
    seen.add(r.dateLabel);
    return true;
  });
}
