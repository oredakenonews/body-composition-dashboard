import { useRef } from 'react';
import { parseCSV, dedup } from '../utils/parseCSV';
import { postToSheets } from '../utils/sheetsAPI';

export default function UploadButton({ onUpload }) {
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) { alert('データを読み込めませんでした。'); return; }
    const result = await postToSheets(rows);
    alert(`${result.added}件追加しました！`);
    onUpload(rows);
    inputRef.current.value = '';
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
      <button onClick={() => inputRef.current.click()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, borderRadius: 8, border: '0.5px solid #ccc', background: '#fff', cursor: 'pointer' }}>
        ＋ CSVをアップロード
      </button>
    </>
  );
}
