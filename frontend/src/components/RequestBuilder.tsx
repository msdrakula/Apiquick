import { useState, useEffect } from 'react';
import { CaptureRule, RequestItem } from '../types';
import AuthPanel from './AuthPanel';
import BodyEditor from './BodyEditor';
import MonacoEditor from './MonacoEditor';
import HighlightedInput from './HighlightedInput';

interface Props {
  request: RequestItem | null;
  onChange: (req: Partial<RequestItem>) => void;
  onSend: () => void;
  onSave: () => void;
  loading: boolean;
  wsConnected?: boolean;
  wsMessageInput?: string;
  onWsConnect?: () => void;
  onWsMessageChange?: (v: string) => void;
  onWsSend?: () => void;
  availableVars?: Set<string>;
  environmentId?: number | null;
  onSendTimes?: (times: number) => void;
}

function methodColor(method: string | null | undefined) {
  const m = (method || '').toUpperCase();
  if (m === 'GET') return 'text-green-400';
  if (m === 'POST') return 'text-yellow-400';
  if (m === 'PUT') return 'text-blue-400';
  if (m === 'DELETE') return 'text-red-400';
  if (m === 'PATCH') return 'text-purple-400';
  if (m === 'HEAD') return 'text-teal-400';
  if (m === 'OPTIONS') return 'text-indigo-400';
  if (m === 'WS') return 'text-pink-400';
  if (m === 'GRPC') return 'text-cyan-400';
  return 'text-gray-400';
}

function countEnabled(items?: Array<{ enabled?: boolean }>) {
  return (items || []).filter(i => i.enabled !== false).length;
}

export default function RequestBuilder({ request, onChange, onSend, onSave, loading, wsConnected, wsMessageInput, onWsConnect, onWsMessageChange, onWsSend, availableVars, environmentId, onSendTimes }: Props) {
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'capture'>('params');
  const [repeat, setRepeat] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!request?.url) {
      setPreviewUrl('');
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/execute/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: request.url,
            collection_id: request.collection_id || null,
            environment_id: environmentId || null,
          }),
        });
        const data = await res.json();
        setPreviewUrl(data.url || '');
      } catch {
        setPreviewUrl('');
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [request?.url, request?.collection_id, environmentId]);

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Select a request to start
      </div>
    );
  }

  const updateField = (field: keyof RequestItem, value: any) => {
    onChange({ [field]: value });
  };

  const addItem = (field: 'headers' | 'params') => {
    const arr = [...(request[field] || [])];
    arr.push({ key: '', value: '', enabled: true });
    updateField(field, arr);
  };

  const updateItem = (field: 'headers' | 'params', idx: number, key: string, value: string, enabled?: boolean) => {
    const arr = [...(request[field] || [])];
    arr[idx] = { ...arr[idx], key, value, enabled: enabled !== undefined ? enabled : arr[idx].enabled };
    updateField(field, arr);
  };

  const removeItem = (field: 'headers' | 'params', idx: number) => {
    const arr = [...(request[field] || [])];
    arr.splice(idx, 1);
    updateField(field, arr);
  };

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'WS', 'GRPC'];

  const paramCount = countEnabled(request.params);
  const headerCount = countEnabled(request.headers);
  const hasBody = !!(request.body_type && request.body_type !== 'none');
  const hasAuth = !!(request.auth_type && request.auth_type !== 'none');
  const hasScripts = !!(request.pre_request_script || request.test_script);
  const captures = request.captures || [];

  const tabs: { id: 'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'capture'; label: string; count?: number; indicator?: boolean }[] = [
    { id: 'params', label: 'Params', count: paramCount },
    { id: 'auth', label: 'Auth', indicator: hasAuth },
    { id: 'headers', label: 'Headers', count: headerCount },
    { id: 'body', label: 'Body', indicator: hasBody },
    { id: 'scripts', label: 'Scripts', indicator: hasScripts },
    { id: 'capture', label: 'Capture', count: captures.length },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0b1120]">
      {/* URL Bar */}
      <div className="px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2 flex-wrap">
        <select
          value={request.method}
          onChange={e => updateField('method', e.target.value)}
          className={`bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-blue-500 ${methodColor(request.method)}`}
        >
          {methods.map(m => <option key={m} value={m} className={methodColor(m)}>{m}</option>)}
        </select>
        <HighlightedInput
          value={request.url || ''}
          onChange={v => updateField('url', v)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded"
          placeholder="Enter request URL"
          availableVars={availableVars}
        />
        {request.method === 'WS' ? (
          <>
            <button
              onClick={onWsConnect}
              className={`px-4 py-1.5 rounded text-xs font-medium ${wsConnected ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {wsConnected ? 'Disconnect' : 'Connect'}
            </button>
            {wsConnected && (
              <>
                <input
                  value={wsMessageInput || ''}
                  onChange={e => onWsMessageChange?.(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onWsSend?.()}
                  className="w-40 min-w-0 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                  placeholder="Message..."
                />
                <button onClick={onWsSend} className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-xs font-medium text-white">Send</button>
              </>
            )}
          </>
        ) : (
          <>
            <input
              type="number"
              min={1}
              max={100}
              value={repeat}
              onChange={e => setRepeat(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="w-14 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs outline-none"
              title="Repeat count"
            />
            <button
              onClick={() => (repeat > 1 && onSendTimes ? onSendTimes(repeat) : onSend())}
              disabled={loading}
              className="gm-btn-primary px-5"
            >
              {loading ? 'Sending...' : repeat > 1 ? `Send ×${repeat}` : 'Send'}
            </button>
          </>
        )}
        <button
          onClick={onSave}
          className="gm-btn-ghost"
        >
          Save
        </button>
        </div>
        {previewUrl && previewUrl !== request.url && (
          <div className="mt-1 text-[11px] text-zinc-500 font-mono truncate" title={previewUrl}>
            → {previewUrl}
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="px-4 flex border-b border-gray-800 text-xs">
        {request.method === 'GRPC' ? (
          <span className="py-2 px-1 text-blue-400 border-b-2 border-blue-500 font-medium">gRPC</span>
        ) : (
          tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab.id ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0 rounded-full min-w-[16px] text-center">
                  {tab.count}
                </span>
              )}
              {tab.indicator && (
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Params */}
        <div className={activeTab === 'params' ? 'block' : 'hidden'}>
          <div className="p-4 space-y-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Query Params</div>
            {(request.params || []).map((p, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="checkbox" checked={p.enabled !== false} onChange={e => updateItem('params', idx, p.key, p.value, e.target.checked)} className="mt-2.5" />
                <input value={p.key} onChange={e => updateItem('params', idx, e.target.value, p.value, p.enabled)} placeholder="Key" className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
                <input value={p.value} onChange={e => updateItem('params', idx, p.key, e.target.value, p.enabled)} placeholder="Value" className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
                <button onClick={() => removeItem('params', idx)} className="text-gray-500 hover:text-red-400 px-2 text-sm">×</button>
              </div>
            ))}
            <button onClick={() => addItem('params')} className="text-blue-400 hover:text-blue-300 text-xs mt-1">+ Add param</button>
          </div>
        </div>

        {/* Auth */}
        <div className={activeTab === 'auth' ? 'block' : 'hidden'}>
          <AuthPanel
            authType={request.auth_type || 'none'}
            auth={request.auth || {}}
            onChange={(type, auth) => { updateField('auth_type', type); updateField('auth', auth); }}
          />
        </div>

        {/* Headers */}
        <div className={activeTab === 'headers' ? 'block' : 'hidden'}>
          <div className="p-4 space-y-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Headers</div>
            {(request.headers || []).map((h, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="checkbox" checked={h.enabled !== false} onChange={e => updateItem('headers', idx, h.key, h.value, e.target.checked)} className="mt-2.5" />
                <input value={h.key} onChange={e => updateItem('headers', idx, e.target.value, h.value, h.enabled)} placeholder="Key" className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
                <input value={h.value} onChange={e => updateItem('headers', idx, h.key, e.target.value, h.enabled)} placeholder="Value" className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500" />
                <button onClick={() => removeItem('headers', idx)} className="text-gray-500 hover:text-red-400 px-2 text-sm">×</button>
              </div>
            ))}
            <button onClick={() => addItem('headers')} className="text-blue-400 hover:text-blue-300 text-xs mt-1">+ Add header</button>
          </div>
        </div>

        {/* Body — conditional render for Monaco */}
        {activeTab === 'body' && (
          <BodyEditor
            bodyType={request.body_type || 'none'}
            bodyContent={request.body_content || ''}
            bodyRawType={request.body_raw_type || 'json'}
            onChange={(type, content, rawType) => {
              updateField('body_type', type);
              updateField('body_content', content);
              updateField('body_raw_type', rawType);
            }}
          />
        )}

        {/* gRPC */}
        {request.method === 'GRPC' && (
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Service</label>
              <input
                value={request.grpc_service || ''}
                onChange={e => onChange({ grpc_service: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                placeholder="package.ServiceName"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Method</label>
              <input
                value={request.grpc_method || ''}
                onChange={e => onChange({ grpc_method: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                placeholder="UnaryMethod"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Proto Definition</label>
              <MonacoEditor
                value={request.grpc_proto || ''}
                onChange={v => onChange({ grpc_proto: v })}
                language="protobuf"
                height="150px"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Message (JSON)</label>
              <MonacoEditor
                value={request.grpc_message || ''}
                onChange={v => onChange({ grpc_message: v })}
                language="json"
                height="100px"
              />
            </div>
          </div>
        )}

        {/* Scripts — conditional render for Monaco */}
        {activeTab === 'scripts' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Pre-request Script</label>
              <MonacoEditor
                value={request.pre_request_script || ''}
                onChange={v => updateField('pre_request_script', v)}
                language="javascript"
                height="150px"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tests</label>
              <MonacoEditor
                value={request.test_script || ''}
                onChange={v => updateField('test_script', v)}
                language="javascript"
                height="150px"
              />
            </div>
          </div>
        )}

        {activeTab === 'capture' && (
          <div className="p-4 space-y-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Save JSON fields from the response into variables</div>
            {captures.map((c, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={c.path}
                  onChange={e => {
                    const next = [...captures];
                    next[idx] = { ...next[idx], path: e.target.value };
                    updateField('captures', next);
                  }}
                  placeholder="JSON path, e.g. id"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs"
                />
                <span className="text-gray-500 text-xs">→</span>
                <input
                  value={c.key}
                  onChange={e => {
                    const next = [...captures];
                    next[idx] = { ...next[idx], key: e.target.value };
                    updateField('captures', next);
                  }}
                  placeholder="variable name"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs"
                />
                <select
                  value={c.target || 'environment'}
                  onChange={e => {
                    const next = [...captures];
                    next[idx] = { ...next[idx], target: e.target.value as CaptureRule['target'] };
                    updateField('captures', next);
                  }}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs"
                >
                  <option value="environment">Environment</option>
                  <option value="globals">Globals</option>
                  <option value="collection">Collection</option>
                </select>
                <button
                  onClick={() => updateField('captures', captures.filter((_, i) => i !== idx))}
                  className="text-gray-500 hover:text-red-400 px-2"
                >×</button>
              </div>
            ))}
            <button
              onClick={() => updateField('captures', [...captures, { path: 'id', key: 'colId', target: 'environment' }])}
              className="text-blue-400 hover:text-blue-300 text-xs mt-1"
            >+ Add capture</button>
          </div>
        )}
      </div>
    </div>
  );
}
