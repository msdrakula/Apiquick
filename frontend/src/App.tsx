import { useState, useEffect, useCallback, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { Collection, RequestItem, Environment, HistoryItem, Tab, ExecuteResponse } from './types';
import { BUILTIN_GENERATORS } from './utils/generators';
import { apiGet, apiPost, apiPut, apiDelete } from './hooks/useApi';
import { parseMaybe } from './lib/parse';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import RequestBuilder from './components/RequestBuilder';
import ResponsePanel from './components/ResponsePanel';
import CollectionPanel from './components/CollectionPanel';
import EnvironmentModal from './components/EnvironmentModal';
import ImportModal from './components/ImportModal';
import SaveRequestModal from './components/SaveRequestModal';
import ResizeHandle from './components/ResizeHandle';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';
import GitModal from './components/GitModal';

const DEFAULT_REQUEST: RequestItem = {
  id: 0,
  collection_id: 0,
  name: 'Untitled',
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: [],
  params: [],
  body_type: 'none',
  body_content: '',
  body_raw_type: 'json',
  auth_type: 'none',
  auth: {},
  pre_request_script: '',
  test_script: '',
  folder: '',
};

function genTabId() {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function failedResponse(message: string): ExecuteResponse {
  return {
    status: 0,
    statusText: 'Error',
    headers: [],
    body: message,
    timeMs: 0,
    timeline: [],
    cookies: [],
    testResults: [],
    error: true,
  };
}

async function postExecute(path: string, payload: any): Promise<ExecuteResponse> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      const detail = data?.detail || data?.error || `${res.status} ${res.statusText}`;
      return failedResponse(typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2));
    }
    return data;
  } catch (e: any) {
    return failedResponse(e?.message || 'Request failed');
  }
}

function hydrateRequest(r: any): RequestItem {
  return {
    ...DEFAULT_REQUEST,
    ...r,
    headers: parseMaybe(r.headers, []),
    params: parseMaybe(r.params, []),
    auth: parseMaybe(r.auth, {}),
    captures: parseMaybe(r.captures, []),
    folder: r.folder || '',
  };
}

function hydrateHistory(h: any): HistoryItem {
  return {
    ...h,
    headers: parseMaybe(h.headers, []),
    params: parseMaybe(h.params, []),
    response_headers: parseMaybe(h.response_headers, []),
    timeline: parseMaybe(h.timeline, []),
    cookies: parseMaybe(h.cookies, []),
    test_results: parseMaybe(h.test_results, []),
  };
}

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(() => {
    const saved = localStorage.getItem('aq_selectedEnvId');
    if (saved == null || saved === '') return null;
    const n = Number(saved);
    return Number.isFinite(n) ? n : null;
  });
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [globals, setGlobals] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('aq_sidebarWidth') || localStorage.getItem('gm_sidebarWidth');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [wsMessageInput, setWsMessageInput] = useState('');
  const wsByTab = useRef<Record<string, WebSocket>>({});

  const activeTab = tabs.find(t => t.id === activeTabId) || null;
  const sendRef = useRef<() => void>(() => {});
  const saveRef = useRef<() => void>(() => {});

  const loadCollections = useCallback(async () => {
    const data = await apiGet('/collections');
    setCollections(data.map((c: any) => ({
      ...c,
      auth: typeof c.auth === 'string' ? parseMaybe(c.auth, {}) : c.auth || {},
      variables: typeof c.variables === 'string' ? parseMaybe(c.variables, []) : c.variables || [],
    })));
  }, []);

  const loadRequests = useCallback(async () => {
    const data = await apiGet('/requests');
    setRequests(data.map(hydrateRequest));
  }, []);

  const loadEnvironments = useCallback(async () => {
    const data = await apiGet('/environments');
    setEnvironments(data.map((e: any) => ({ ...e, variables: parseMaybe(e.variables, []) })));
  }, []);

  const loadHistory = useCallback(async () => {
    const data = await apiGet('/history');
    setHistory(data.map(hydrateHistory));
  }, []);

  const loadGlobals = useCallback(async () => {
    setGlobals(await apiGet('/globals'));
  }, []);

  useEffect(() => {
    loadCollections();
    loadRequests();
    loadEnvironments();
    loadHistory();
    loadGlobals();
  }, []);

  useEffect(() => {
    if (!environments.length) return;
    if (selectedEnvId != null && environments.some(e => e.id === selectedEnvId)) return;
    if (localStorage.getItem('aq_selectedEnvId') === '') return;
    const named = environments.find(e => e.name === 'Apiquick Local');
    if (named) {
      setSelectedEnvId(named.id);
      localStorage.setItem('aq_selectedEnvId', String(named.id));
    }
  }, [environments, selectedEnvId]);

  const openRequest = (req: RequestItem) => {
    setSelectedCollectionId(null);
    if (req.id > 0) {
      const existing = tabs.find(t => t.request.id === req.id);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }
    }
    const tab: Tab = { id: genTabId(), request: { ...req }, dirty: false };
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const closeTab = (id: string) => {
    const ws = wsByTab.current[id];
    if (ws) {
      ws.close();
      delete wsByTab.current[id];
    }
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        const newActive = next[idx] || next[idx - 1] || next[0] || null;
        setActiveTabId(newActive ? newActive.id : null);
      }
      return next;
    });
  };

  const updateTab = (id: string, patch: Partial<RequestItem>) => {
    setTabs(prev =>
      prev.map(t =>
        t.id === id ? { ...t, request: { ...t.request, ...patch }, dirty: true } : t
      )
    );
  };

  const handleSelectCollection = (id: number | null) => {
    setSelectedCollectionId(id);
    if (id !== null) setActiveTabId(null);
  };

  const handleUpdateCollection = async (id: number, patch: Partial<Collection>) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    try {
      await apiPut(`/collections/${id}`, patch);
      loadCollections();
    } catch (e: any) {
      setToast('Failed to update collection: ' + e.message);
      loadCollections();
    }
  };

  const handleCreateCollection = async () => {
    const name = prompt('Collection name:', 'My Collection');
    if (!name) return;
    const res = await apiPost('/collections', { name, description: '' });
    await loadCollections();
    setSelectedCollectionId(res.id);
    setActiveTabId(null);
  };

  const handleRenameCollection = async (id: number, name: string) => {
    await apiPut(`/collections/${id}`, { name });
    loadCollections();
  };

  const handleDuplicateCollection = async (id: number) => {
    await apiPost(`/collections/${id}/duplicate`);
    loadCollections();
    loadRequests();
  };

  const handleDeleteCollection = async (id: number) => {
    try {
      await apiDelete(`/collections/${id}`);
      await loadCollections();
      await loadRequests();
      setTabs(prev => prev.filter(t => t.request.collection_id !== id));
      if (selectedCollectionId === id) setSelectedCollectionId(null);
    } catch (e: any) {
      setToast('Could not delete collection: ' + (e?.message || e));
    }
  };

  const handleAddRequest = async (collectionId: number) => {
    try {
      const data = await apiPost('/requests', {
        collection_id: collectionId,
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        params: [],
        body_type: 'none',
        body_content: '',
        body_raw_type: 'json',
      });
      if (!data || !data.id) {
        setToast('Could not create request');
        return;
      }
      await loadRequests();
      openRequest(hydrateRequest(data));
    } catch (e: any) {
      setToast('Could not create request: ' + (e?.message || e));
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Delete request?')) return;
    await apiDelete(`/requests/${id}`);
    loadRequests();
    setTabs(prev => {
      const next = prev.filter(t => t.request.id !== id);
      if (activeTabId && !next.find(t => t.id === activeTabId)) {
        const idx = prev.findIndex(t => t.id === activeTabId);
        const newActive = next[idx] || next[idx - 1] || next[0] || null;
        setActiveTabId(newActive ? newActive.id : null);
      }
      return next;
    });
  };

  const handleSend = async (times = 1) => {
    if (!activeTab) return;
    const tab = activeTab;
    const count = Math.max(1, Math.min(100, times));
    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, loading: true } : t));
    try {
      if (tab.request.method === 'GRPC') {
        let message: any = {};
        try {
          message = JSON.parse(tab.request.grpc_message || '{}');
        } catch (e: any) {
          setTabs(prev => prev.map(t => t.id === tab.id ? {
            ...t,
            response: failedResponse('Invalid gRPC message JSON: ' + (e?.message || e)),
            loading: false,
          } : t));
          return;
        }
        const res = await postExecute('/execute-grpc', {
          url: tab.request.url,
          service: tab.request.grpc_service,
          method: tab.request.grpc_method,
          proto: tab.request.grpc_proto,
          message,
        });
        if (res.error) {
          setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, response: res, loading: false } : t));
          return;
        }
        setTabs(prev => prev.map(t => t.id === tab.id ? {
          ...t,
          previousResponse: t.response,
          response: {
            status: 200,
            statusText: 'OK',
            headers: [{ key: 'content-type', value: 'application/json', enabled: true }],
            body: JSON.stringify((res as any).result ?? res.body, null, 2),
            timeMs: 0,
            timeline: [{ name: 'gRPC Call', start: 0, end: 0 }],
            cookies: [],
          },
          loading: false,
        } : t));
      } else {
        const statuses: number[] = [];
        let last = failedResponse('No response');
        const prev = tab.response;
        for (let i = 0; i < count; i++) {
          last = await postExecute('/execute', {
            request_id: tab.request.id || null,
            collection_id: tab.request.collection_id,
            name: tab.request.name,
            method: tab.request.method,
            url: tab.request.url,
            headers: tab.request.headers,
            params: tab.request.params,
            body_type: tab.request.body_type,
            body_content: tab.request.body_content,
            body_raw_type: tab.request.body_raw_type,
            auth_type: tab.request.auth_type,
            auth: tab.request.auth,
            pre_request_script: tab.request.pre_request_script,
            test_script: tab.request.test_script,
            captures: tab.request.captures || [],
            environment_id: selectedEnvId,
          });
          statuses.push(last.status);
        }
        const ok = statuses.filter(s => s > 0 && s < 400).length;
        setTabs(prevTabs => prevTabs.map(t => t.id === tab.id ? {
          ...t,
          previousResponse: prev,
          response: last,
          runSummary: count > 1 ? `${ok}/${count} ok (${statuses.join(', ')})` : undefined,
          loading: false,
        } : t));
        if (!last.error) {
          loadHistory();
          loadEnvironments();
          loadGlobals();
          loadCollections();
        }
      }
    } catch (e: any) {
      setTabs(prev => prev.map(t => t.id === tab.id ? {
        ...t,
        response: failedResponse(e?.message || 'Request failed'),
        loading: false,
      } : t));
    }
  };

  const handleSave = async () => {
    if (!activeTab) return;
    const req = activeTab.request;
    if (req.id > 0) {
      await apiPut(`/requests/${req.id}`, { ...req });
      setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, dirty: false } : t));
      loadRequests();
      setToast('Saved');
    } else {
      setShowSaveModal(true);
    }
  };

  sendRef.current = handleSend;
  saveRef.current = handleSave;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === 'Enter') {
        e.preventDefault();
        sendRef.current();
      }
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleConnectWS = () => {
    if (!activeTab) return;
    const tabId = activeTab.id;
    const existing = wsByTab.current[tabId];
    if (existing) {
      existing.close();
      delete wsByTab.current[tabId];
      setWsConnected(false);
      return;
    }
    try {
      const ws = new WebSocket(activeTab.request.url);
      wsByTab.current[tabId] = ws;
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (event) => {
        setTabs(prev => prev.map(t => t.id === tabId ? {
          ...t,
          wsMessages: [...(t.wsMessages || []), { type: 'in', data: String(event.data), time: new Date().toLocaleTimeString() }],
        } : t));
      };
      ws.onclose = () => {
        setWsConnected(false);
        delete wsByTab.current[tabId];
      };
      ws.onerror = () => {
        setTabs(prev => prev.map(t => t.id === tabId ? {
          ...t,
          wsMessages: [...(t.wsMessages || []), { type: 'status', data: 'Error', time: new Date().toLocaleTimeString() }],
        } : t));
      };
    } catch (e: any) {
      setToast('WS Error: ' + e.message);
    }
  };

  const handleSendWS = () => {
    if (!activeTab || !wsMessageInput) return;
    const ws = wsByTab.current[activeTab.id];
    if (!ws) return;
    ws.send(wsMessageInput);
    setTabs(prev => prev.map(t => t.id === activeTab.id ? {
      ...t,
      wsMessages: [...(t.wsMessages || []), { type: 'out', data: wsMessageInput, time: new Date().toLocaleTimeString() }],
    } : t));
    setWsMessageInput('');
  };

  const handleLoadHistory = (item: HistoryItem) => {
    const req: RequestItem = {
      ...DEFAULT_REQUEST,
      id: 0,
      name: item.name || 'History Request',
      method: item.method || 'GET',
      url: item.url || '',
      headers: item.headers || [],
      params: item.params || [],
      body_type: item.body_type || 'none',
      body_content: item.body_content || '',
    };
    const tab: Tab = {
      id: genTabId(),
      request: req,
      dirty: false,
      response: {
        status: item.response_status || 0,
        statusText: item.response_status_text || '',
        headers: item.response_headers || [],
        body: item.response_body || '',
        timeMs: item.response_time_ms || 0,
        timeline: item.timeline || [],
        cookies: item.cookies || [],
        testResults: item.test_results || [],
      },
    };
    setSelectedCollectionId(null);
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const onSavedRequest = (savedReq: RequestItem) => {
    loadRequests();
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, request: hydrateRequest(savedReq), dirty: false } : t));
    setToast('Saved');
  };

  const openScratch = () => openRequest({ ...DEFAULT_REQUEST });

  return (
    <div className="h-screen flex flex-col bg-[#0b0d12] text-zinc-100 overflow-hidden">
      <div className="h-11 bg-[#12151c] border-b border-[#1e2430] flex items-center px-3 justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[#ff6c37] flex items-center justify-center font-bold text-white text-sm">A</div>
          <div>
            <div className="text-[13px] font-semibold leading-none tracking-wide">Apiquick</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">API client</div>
          </div>
          <button onClick={openScratch} className="gm-btn-ghost ml-2">New request</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 hidden sm:inline">Ctrl+Enter send · Ctrl+S save</span>
          <select
            value={selectedEnvId ?? ''}
            onChange={e => {
              const next = e.target.value ? Number(e.target.value) : null;
              setSelectedEnvId(next);
              localStorage.setItem('aq_selectedEnvId', next == null ? '' : String(next));
            }}
            className="gm-input min-w-[160px]"
          >
            <option value="">No environment</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
          <button onClick={() => setShowEnvModal(true)} className="gm-btn-ghost">Variables</button>
          <button onClick={() => setShowGitModal(true)} className="gm-btn-ghost">Git</button>
          <button onClick={() => setShowSettingsModal(true)} className="gm-btn-ghost">Safety</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div style={{ width: sidebarWidth }} className="min-w-[180px] max-w-[50vw] flex flex-col">
          <Sidebar
            collections={collections}
            requests={requests}
            history={history}
            selectedRequestId={activeTab?.request.id ?? null}
            selectedCollectionId={selectedCollectionId}
            onSelectRequest={openRequest}
            onSelectCollection={handleSelectCollection}
            onCreateCollection={handleCreateCollection}
            onRenameCollection={handleRenameCollection}
            onDuplicateCollection={handleDuplicateCollection}
            onDeleteCollection={handleDeleteCollection}
            onAddRequest={handleAddRequest}
            onDeleteRequest={handleDeleteRequest}
            onLoadHistory={handleLoadHistory}
            onShowImportModal={() => setShowImportModal(true)}
          />
        </div>

        <ResizeHandle
          direction="horizontal"
          onResize={(delta) => {
            setSidebarWidth((prev) => {
              const next = Math.max(180, Math.min(window.innerWidth * 0.5, prev + delta));
              localStorage.setItem('aq_sidebarWidth', String(next));
              return next;
            });
          }}
        />

        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0b0d12]">
          {tabs.length > 0 && (
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelect={(id) => { setActiveTabId(id); setSelectedCollectionId(null); }}
              onClose={closeTab}
            />
          )}

          {selectedCollectionId !== null ? (() => {
            const col = collections.find(c => c.id === selectedCollectionId);
            if (!col) {
              return (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  Collection not found.
                </div>
              );
            }
            return (
              <CollectionPanel
                collection={col}
                requestsCount={requests.filter(r => r.collection_id === selectedCollectionId).length}
                environmentId={selectedEnvId}
                onChange={patch => handleUpdateCollection(selectedCollectionId, patch)}
                onImport={() => { loadRequests(); loadHistory(); }}
                onAddRequest={() => handleAddRequest(selectedCollectionId)}
                onDelete={() => handleDeleteCollection(selectedCollectionId)}
              />
            );
          })() : activeTab ? (
            <Group orientation="vertical" className="flex-1 min-h-0">
              <Panel defaultSize={55} minSize={20} className="min-h-0 flex flex-col">
                <RequestBuilder
                  request={activeTab.request}
                  onChange={patch => updateTab(activeTab.id, patch)}
                  onSend={handleSend}
                  onSendTimes={handleSend}
                  onSave={handleSave}
                  loading={activeTab.loading || false}
                  environmentId={selectedEnvId}
                  wsConnected={!!wsByTab.current[activeTab.id] && wsConnected}
                  wsMessageInput={wsMessageInput}
                  onWsConnect={handleConnectWS}
                  onWsMessageChange={setWsMessageInput}
                  onWsSend={handleSendWS}
                  availableVars={(() => {
                    const set = new Set<string>(Array.from(BUILTIN_GENERATORS));
                    for (const g of globals) if (g.key) set.add(g.key);
                    const env = environments.find(e => e.id === selectedEnvId);
                    if (env?.variables) for (const v of env.variables) if (v.enabled !== false && v.key) set.add(v.key);
                    const col = collections.find(c => c.id === activeTab.request.collection_id);
                    if (col?.variables) for (const v of col.variables) if (v.enabled !== false && v.key) set.add(v.key);
                    return set;
                  })()}
                />
              </Panel>
              <Separator className="h-1.5 bg-[#1e2430] hover:bg-[#ff6c37]/40 transition-colors cursor-row-resize flex items-center justify-center">
                <div className="w-8 h-0.5 bg-zinc-600 rounded-full" />
              </Separator>
              <Panel defaultSize={45} minSize={20} className="min-h-0 flex flex-col">
                <ResponsePanel
                  response={activeTab.response || null}
                  previousResponse={activeTab.previousResponse || null}
                  runSummary={activeTab.runSummary}
                  loading={activeTab.loading || false}
                  wsMessages={activeTab.wsMessages || []}
                  isWS={activeTab.request.method === 'WS'}
                />
              </Panel>
            </Group>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-5 max-w-sm">
                <div className="w-14 h-14 bg-[#ff6c37] rounded-2xl flex items-center justify-center mx-auto text-white text-2xl font-bold">A</div>
                <div>
                  <div className="text-lg font-semibold">Send your first request</div>
                  <div className="text-sm text-zinc-500 mt-1">Open a collection, import Postman, or start from a blank tab.</div>
                </div>
                <div className="flex justify-center gap-2">
                  <button onClick={openScratch} className="gm-btn-primary">New request</button>
                  <button onClick={handleCreateCollection} className="gm-btn-ghost">New collection</button>
                  <button onClick={() => setShowImportModal(true)} className="gm-btn-ghost">Import</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGitModal && (
        <GitModal onClose={() => setShowGitModal(false)} />
      )}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
      {showEnvModal && (
        <EnvironmentModal
          environments={environments}
          onClose={() => setShowEnvModal(false)}
          onUpdate={() => { loadEnvironments(); loadGlobals(); }}
        />
      )}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={() => { loadCollections(); loadRequests(); }}
        />
      )}
      {showSaveModal && activeTab && (
        <SaveRequestModal
          collections={collections}
          currentCollectionId={activeTab.request.collection_id}
          requestName={activeTab.request.name}
          requestData={activeTab.request}
          onClose={() => setShowSaveModal(false)}
          onSaved={(savedReq: RequestItem) => onSavedRequest(savedReq)}
        />
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
