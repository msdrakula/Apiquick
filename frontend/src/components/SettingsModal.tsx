import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '../hooks/useApi';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [hosts, setHosts] = useState('127.0.0.1,localhost');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    apiGet('/settings').then((s) => {
      setEnabled(!!s.allowlistEnabled);
      setHosts(s.allowlistHosts || '127.0.0.1,localhost');
    }).catch(() => {});
  }, []);

  const save = async () => {
    await apiPut('/settings', { allowlistEnabled: enabled, allowlistHosts: hosts });
    setSaved('Saved');
    setTimeout(() => setSaved(''), 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[560px] max-w-[95vw] p-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Safety</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          Block Send to hosts outside the allowlist
        </label>
        <div className="text-[10px] text-gray-500 uppercase mb-1">Allowed hosts</div>
        <textarea
          value={hosts}
          onChange={e => setHosts(e.target.value)}
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          placeholder="127.0.0.1, localhost, api.example.com"
        />
        <div className="text-[11px] text-gray-500 mt-1">Comma-separated. Wildcards like *.example.com are allowed.</div>
        <div className="flex justify-end gap-2 mt-4">
          {saved && <span className="text-green-400 text-sm py-1.5">{saved}</span>}
          <button onClick={save} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}
