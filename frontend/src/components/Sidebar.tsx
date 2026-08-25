import { useState, useMemo, useEffect, useRef } from 'react';
import { Collection, RequestItem, HistoryItem } from '../types';
import ContextMenu from './ContextMenu';

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

function methodBg(method: string | null | undefined) {
  const m = (method || '').toUpperCase();
  if (m === 'GET') return 'bg-green-900/30';
  if (m === 'POST') return 'bg-yellow-900/30';
  if (m === 'PUT') return 'bg-blue-900/30';
  if (m === 'DELETE') return 'bg-red-900/30';
  if (m === 'PATCH') return 'bg-purple-900/30';
  if (m === 'HEAD') return 'bg-teal-900/30';
  if (m === 'OPTIONS') return 'bg-indigo-900/30';
  if (m === 'WS') return 'bg-pink-900/30';
  if (m === 'GRPC') return 'bg-cyan-900/30';
  return 'bg-gray-800';
}

interface Props {
  collections: Collection[];
  requests: RequestItem[];
  history: HistoryItem[];
  selectedRequestId: number | null;
  onSelectRequest: (req: RequestItem) => void;
  onSelectCollection: (id: number | null) => void;
  onCreateCollection: () => void;
  onRenameCollection: (id: number, name: string) => void;
  onDuplicateCollection: (id: number) => void;
  onDeleteCollection: (id: number) => void;
  onAddRequest: (collectionId: number) => void;
  onDeleteRequest: (id: number) => void;
  onLoadHistory: (item: HistoryItem) => void;
  onShowImportModal: () => void;
  selectedCollectionId: number | null;
}

export default function Sidebar(props: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [histExpanded, setHistExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; colId: number } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const toggleCollection = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const filteredCollections = useMemo(() => {
    if (!search.trim()) return props.collections;
    const q = search.toLowerCase();
    return props.collections.filter(c => c.name.toLowerCase().includes(q));
  }, [props.collections, search]);

  const getRequests = (colId: number) => {
    const q = search.toLowerCase();
    const reqs = props.requests.filter(r => r.collection_id === colId);
    if (!search.trim()) return reqs;
    return reqs.filter(r => r.name.toLowerCase().includes(q) || r.method.toLowerCase().includes(q));
  };

  const startRename = (col: { id: number; name: string }) => {
    setEditingId(col.id);
    setEditingName(col.name);
    setExpanded(prev => new Set(prev).add(col.id));
  };

  const commitRename = () => {
    if (editingId !== null && editingName.trim()) {
      props.onRenameCollection(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleContextMenu = (e: React.MouseEvent, colId: number) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, colId });
  };

  const closeMenu = () => setMenu(null);

  return (
    <div className="w-full min-w-0 bg-[#0f172a] border-r border-gray-800 flex flex-col h-full select-none overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b border-gray-800">
        <div className="flex gap-2 mb-2">
          <button onClick={props.onCreateCollection} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] py-1 rounded font-medium">+ Collection</button>
          <button onClick={props.onShowImportModal} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-[11px] py-1 rounded border border-gray-700 font-medium">Import</button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search collections & requests"
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {/* Collections */}
        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Collections</div>
        {filteredCollections.map(col => {
          const reqs = getRequests(col.id);
          const isExpanded = expanded.has(col.id);
          return (
            <div key={col.id} className="mb-0.5">
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group ${
                  props.selectedCollectionId === col.id ? 'bg-blue-900/40 text-blue-300' : 'hover:bg-gray-800 text-gray-300'
                }`}
                onClick={() => props.onSelectCollection(col.id)}
                onContextMenu={(e) => handleContextMenu(e, col.id)}
              >
                <span
                  className="text-gray-500 text-[10px] w-3 hover:text-gray-300"
                  onClick={(e) => { e.stopPropagation(); toggleCollection(col.id); }}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
                {editingId === col.id ? (
                  <input
                    ref={editRef}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                      e.stopPropagation();
                    }}
                    className="flex-1 min-w-0 bg-gray-800 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-gray-200 outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-xs truncate min-w-0">{col.name || 'Untitled Collection'}</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(prev => new Set(prev).add(col.id));
                    props.onAddRequest(col.id);
                  }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-white/10 text-base leading-none"
                  title="New Request"
                >+</button>
                {pendingDeleteId === col.id ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingDeleteId(null);
                      props.onDeleteCollection(col.id);
                    }}
                    className="shrink-0 h-6 px-1.5 flex items-center justify-center rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-medium"
                    title="Confirm delete"
                  >OK?</button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingDeleteId(col.id);
                    }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 text-base leading-none"
                    title="Delete Collection"
                  >×</button>
                )}
              </div>
              {isExpanded && (
                <div className="ml-4">
                  {reqs.length === 0 && <div className="text-[10px] text-gray-600 px-2 py-1">No requests</div>}
                  {(() => {
                    const groups = new Map<string, typeof reqs>();
                    for (const req of reqs) {
                      const folder = req.folder || '';
                      if (!groups.has(folder)) groups.set(folder, []);
                      groups.get(folder)!.push(req);
                    }
                    const folders = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
                    return folders.map(folder => (
                      <div key={folder || '__root'}>
                        {folder ? (
                          <div className="text-[10px] text-zinc-500 px-2 py-1 truncate">{folder}</div>
                        ) : null}
                        {groups.get(folder)!.map(req => (
                    <div
                      key={req.id}
                      onClick={() => props.onSelectRequest(req)}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs ${props.selectedRequestId === req.id ? 'bg-blue-900/40 text-blue-300' : 'hover:bg-gray-800 text-gray-400'}`}
                    >
                      <span className={`text-[10px] font-bold w-9 text-right ${methodColor(req.method)} ${methodBg(req.method)} px-1 rounded`}>{req.method}</span>
                      <span className="flex-1 truncate min-w-0">{req.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); props.onDeleteRequest(req.id); }}
                        className="text-gray-500 hover:text-red-400 text-[10px] px-1"
                      >×</button>
                    </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          );
        })}

        {/* History */}
        <div className="px-2 py-1 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between cursor-pointer" onClick={() => setHistExpanded(v => !v)}>
          <span>History</span>
          <span className="text-gray-600">{histExpanded ? '▼' : '▶'}</span>
        </div>
        {histExpanded && (
          <div className="px-1 space-y-0.5">
            {props.history.map(item => (
              <div
                key={item.id}
                onClick={() => props.onLoadHistory(item)}
                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-800 text-xs"
              >
                <span className={`text-[10px] font-bold w-9 text-right ${methodColor(item.method)} ${methodBg(item.method)} px-1 rounded`}>{item.method}</span>
                <span className="flex-1 truncate text-gray-300 min-w-0">{item.url}</span>
                <span className={`text-[10px] ${(item.response_status || 0) < 300 ? 'text-green-400' : (item.response_status || 0) < 400 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {item.response_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {menu && (() => {
        const col = props.collections.find(c => c.id === menu.colId);
        if (!col) return null;
        return (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            onClose={closeMenu}
            items={[
              { label: 'Add request', onClick: () => props.onAddRequest(col.id) },
              { label: 'Rename', shortcut: 'Ctrl+E', onClick: () => startRename(col) },
              { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: () => props.onDuplicateCollection(col.id) },
              { divider: true, label: '', onClick: () => {} },
              { label: 'Delete', shortcut: 'Del', danger: true, onClick: () => props.onDeleteCollection(col.id) },
            ]}
          />
        );
      })()}
    </div>
  );
}
