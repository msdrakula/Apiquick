import { useState } from 'react';
import { Collection } from '../types';
import AuthPanel from './AuthPanel';
import MonacoEditor from './MonacoEditor';
import { apiPost } from '../hooks/useApi';

interface Props {
  collection: Collection;
  requestsCount: number;
  environmentId?: number | null;
  onChange: (patch: Partial<Collection>) => void;
  onImport?: () => void;
  onAddRequest?: () => void;
  onDelete?: () => void;
}

function safeAuth(value: any): Record<string, any> {
  if (typeof value === 'object' && value !== null) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

function safeVars(value: any): Array<{ key: string; value: string; enabled?: boolean; secret?: boolean }> {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  return [];
}

export default function CollectionPanel({ collection, requestsCount, environmentId, onChange, onImport, onAddRequest, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'authorization' | 'scripts' | 'variables' | 'runs'>('overview');
  const [showImportBru, setShowImportBru] = useState(false);
  const [bruText, setBruText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [runResults, setRunResults] = useState<any[] | null>(null);
  const [running, setRunning] = useState(false);

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'authorization' as const, label: 'Authorization' },
    { key: 'scripts' as const, label: 'Scripts' },
    { key: 'variables' as const, label: 'Variables' },
    { key: 'runs' as const, label: 'Runs' },
  ];

  const vars = safeVars(collection.variables);

  const updateVar = (idx: number, key: string, value: string, enabled: boolean, secret?: boolean) => {
    const next = [...vars];
    next[idx] = { ...next[idx], key, value, enabled, secret };
    onChange({ variables: next });
  };

  const addVar = () => {
    onChange({ variables: [...vars, { key: '', value: '', enabled: true, secret: false }] });
  };

  const removeVar = (idx: number) => {
    const next = [...vars];
    next.splice(idx, 1);
    onChange({ variables: next });
  };

  const handleImportBru = async () => {
    if (!bruText.trim()) return;
    setImportStatus('Importing...');
    try {
      await apiPost('/import-export/bru', { collectionId: collection.id, bruText });
      setImportStatus('Imported successfully!');
      setBruText('');
      onImport?.();
      setTimeout(() => setShowImportBru(false), 800);
    } catch (e: any) {
      setImportStatus('Error: ' + (e.message || 'Import failed'));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0b1120]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="text-xs text-gray-500 mb-1">Collection</div>
        <div className="text-sm font-semibold text-gray-200">{collection.name}</div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex border-b border-gray-800 text-xs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-3 capitalize font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4 max-w-2xl">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Name</label>
              <input
                value={collection.name || ''}
                onChange={e => onChange({ name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Description</label>
              <textarea
                value={collection.description || ''}
                onChange={e => onChange({ description: e.target.value })}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-200 resize-none"
                placeholder="Add a description for this collection..."
              />
            </div>
            <div className="flex gap-2">
              {onAddRequest && (
                <button
                  type="button"
                  onClick={onAddRequest}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  New request
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="bg-gray-800 hover:bg-red-600/80 hover:text-white text-gray-300 px-3 py-1.5 rounded text-xs border border-gray-700"
                >
                  Delete collection
                </button>
              )}
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <div><span className="text-gray-400 font-medium">{requestsCount}</span> requests</div>
              <div>Created: {collection.created_at ? new Date(collection.created_at).toLocaleDateString() : '—'}</div>
            </div>

            {/* Import .bru */}
            <div className="pt-2 border-t border-gray-800">
              <button
                onClick={() => setShowImportBru(!showImportBru)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs border border-gray-700"
              >
                {showImportBru ? 'Cancel' : 'Import .bru file'}
              </button>
              {showImportBru && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={bruText}
                    onChange={e => setBruText(e.target.value)}
                    rows={10}
                    placeholder="Paste .bru file content here..."
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs outline-none focus:border-blue-500 text-gray-200 font-mono resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleImportBru}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs"
                    >
                      Import
                    </button>
                    {importStatus && <span className="text-xs text-gray-400">{importStatus}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'authorization' && (
          <div className="p-4">
            <AuthPanel
              authType={collection.auth_type || 'none'}
              auth={safeAuth(collection.auth)}
              onChange={(type, auth) => { onChange({ auth_type: type, auth }); }}
            />
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Pre-request Script</label>
              <div className="h-40">
                <MonacoEditor
                  value={collection.pre_request_script || ''}
                  onChange={v => onChange({ pre_request_script: v })}
                  language="javascript"
                  height="100%"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tests</label>
              <div className="h-40">
                <MonacoEditor
                  value={collection.test_script || ''}
                  onChange={v => onChange({ test_script: v })}
                  language="javascript"
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="p-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Collection Variables</div>
            <div className="space-y-2">
              {vars.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={v.enabled !== false}
                    onChange={e => updateVar(idx, v.key, v.value, e.target.checked, v.secret)}
                    className="mt-0.5"
                  />
                  <input
                    value={v.key}
                    onChange={e => updateVar(idx, e.target.value, v.value, v.enabled ?? true, v.secret)}
                    placeholder="Variable"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                  <input
                    value={v.secret ? '********' : v.value}
                    onChange={e => updateVar(idx, v.key, e.target.value, v.enabled ?? true, v.secret)}
                    onFocus={e => { if (v.secret) e.currentTarget.value = v.value; }}
                    onBlur={e => { if (v.secret) e.currentTarget.value = '********'; }}
                    placeholder="Value"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={v.secret === true}
                      onChange={e => updateVar(idx, v.key, v.value, v.enabled ?? true, e.target.checked)}
                    />
                    Secret
                  </label>
                  <button
                    onClick={() => removeVar(idx)}
                    className="text-gray-500 hover:text-red-400 px-2"
                  >×</button>
                </div>
              ))}
              <button onClick={addVar} className="text-blue-400 hover:text-blue-300 text-xs mt-1">+ Add Variable</button>
            </div>
          </div>
        )}

        {activeTab === 'runs' && (
          <div className="p-4 space-y-3">
            <button
              disabled={running}
              onClick={async () => {
                setRunning(true);
                try {
                  const res = await apiPost(`/execute/collection/${collection.id}`, { environment_id: environmentId });
                  setRunResults(res.results || []);
                  onImport?.();
                } catch (e: any) {
                  setRunResults([{ name: 'Run failed', error: e.message }]);
                } finally {
                  setRunning(false);
                }
              }}
              className="gm-btn-primary"
            >
              {running ? 'Running…' : 'Run collection'}
            </button>
            {!runResults && <div className="text-zinc-500 text-sm">Runs every HTTP request in this collection, in order. WS and gRPC are skipped.</div>}
            {runResults && (
              <div className="space-y-1">
                {runResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-[#1e2430]">
                    <span className="w-40 truncate text-zinc-200">{r.name}</span>
                    {r.skipped ? (
                      <span className="text-zinc-500">skipped {r.reason}</span>
                    ) : r.error ? (
                      <span className="text-rose-400">{r.error}</span>
                    ) : (
                      <>
                        <span className={(r.status || 0) < 400 ? 'text-emerald-400' : 'text-rose-400'}>{r.status}</span>
                        <span className="text-zinc-500">{r.timeMs}ms</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
