const GAS_URL = 'https://script.google.com/macros/s/AKfycbwxit94q5LBW_o34AU1YNS7mFUKOTcGzc2JxcRMcotQixMiTkre2k9BaOUdPRMouGftDg/exec';

export async function fetchFromSheets() {
  const res = await fetch(GAS_URL);
  const data = await res.json();
  return data.slice(1);
}

export async function postToSheets(rows) {
  const payload = { rows: rows.map(r => r.raw) };
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return await res.json();
}
