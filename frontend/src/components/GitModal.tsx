import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut } from '../hooks/useApi';

interface GitStatus {
  folder?: string;
  available?: boolean;
  repo?: boolean;
  branch?: string;
  files?: string[];
  dirty?: boolean;
  written?: string[];
  empty?: boolean;
  log?: string;
  error?: string;
}

interface Props {
  onClose: () => void;
}

export default function GitModal({ onClose }: Props) {
  const [pathValue, setPathValue] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<GitStatus>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const s = await apiGet('/git/status');
      setStatus(s);
      if (s.folder) setPathValue(s.folder);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load git status');
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (label: string, fn: () => Promise<any>) => {
    setBusy(label);
    setError('');
    try {
      const s = await fn();
      setStatus(s);
      if (s.folder) setPathValue(s.folder);
    } catch (e: any) {
      setError(e.message || label + ' failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[640px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-semibold">Git</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="text-xs text-gray-400">
            Link a folder (git repo). Sync writes collections as JSON, then you commit.
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Folder</div>
            <div className="flex gap-2">
              <input
                value={pathValue}
                onChange={e => setPathValue(e.target.value)}
                placeholder="C:\Users\You\api-collections"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
              <button
                disabled={!!busy}
                onClick={() => run('Saving folder', () => apiPut('/git/folder', { path: pathValue }))}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded text-sm"
              >Set</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button disabled={!!busy} onClick={() => run('Init', () => apiPost('/git/init', {}))} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded text-sm">Init repo</button>
            <button disabled={!!busy} onClick={() => run('Sync', () => apiPost('/git/sync', {}))} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm">Sync collections</button>
            <button disabled={!!busy} onClick={load} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded text-sm">Refresh</button>
          </div>

          {status.folder && (
            <div className="text-xs text-gray-400">
              {status.available === false && <div className="text-red-400">git is not on PATH</div>}
              <div>Repo: {status.repo ? (status.branch || 'yes') : 'no'}</div>
            </div>
          )}

          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Changed files</div>
            <div className="bg-gray-950 border border-gray-800 rounded p-2 max-h-40 overflow-auto text-[11px] font-mono text-gray-300">
              {(status.files || []).length === 0 ? <span className="text-gray-600">Clean</span> : (status.files || []).map((f, i) => <div key={i}>{f}</div>)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Commit message</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Update collections"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}
          {status.empty && <div className="text-zinc-400 text-sm">Nothing to commit</div>}
          {status.log && <div className="text-green-400 text-sm font-mono whitespace-pre-wrap">{status.log}</div>}
          {busy && <div className="text-zinc-400 text-sm">{busy}…</div>}
        </div>
        <div className="p-4 border-t border-gray-800 flex justify-end">
          <button
            disabled={!!busy || !message.trim()}
            onClick={() => run('Commit', () => apiPost('/git/commit', { message: message.trim() }))}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-1.5 rounded text-sm"
          >Commit</button>
        </div>
      </div>
    </div>
  );
}
