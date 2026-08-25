import { useState, useEffect } from 'react';
import { Environment, GlobalVar } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../hooks/useApi';

interface Props {
  environments: Environment[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function EnvironmentModal({ environments, onClose, onUpdate }: Props) {
  const [activeSection, setActiveSection] = useState<'environments' | 'globals'>('environments');
  const [editing, setEditing] = useState<Environment | null>(null);
  const [globals, setGlobals] = useState<GlobalVar[]>([]);
  const [editingGlobals, setEditingGlobals] = useState(false);

  useEffect(() => {
    apiGet('/globals').then(setGlobals);
  }, []);

  const create = () => {
    setEditing({ id: 0, name: 'New Environment', variables: [] });
  };

  const save = async () => {
    if (!editing) return;
    if (editing.id) {
      await apiPut(`/environments/${editing.id}`, editing);
    } else {
      await apiPost('/environments/', editing);
    }
    setEditing(null);
    onUpdate();
  };

  const del = async (id: number) => {
    if (!confirm('Delete environment?')) return;
    await apiDelete(`/environments/${id}`);
    onUpdate();
  };

  const updateVar = (idx: number, key: string, value: string, enabled: boolean, secret?: boolean) => {
    if (!editing) return;
    const vars = [...editing.variables];
    vars[idx] = { ...vars[idx], key, value, enabled, secret };
    setEditing({ ...editing, variables: vars });
  };

  const addVar = () => {
    if (!editing) return;
    setEditing({ ...editing, variables: [...editing.variables, { key: '', value: '', enabled: true, secret: false }] });
  };

  const removeVar = (idx: number) => {
    if (!editing) return;
    const vars = [...editing.variables];
    vars.splice(idx, 1);
    setEditing({ ...editing, variables: vars });
  };

  // Global variables
  const saveGlobal = async (g: GlobalVar) => {
    if (g.id) {
      await apiPut(`/globals/${g.id}`, { key: g.key, value: g.value, secret: g.secret });
    } else {
      await apiPost('/globals', { key: g.key, value: g.value, secret: g.secret });
    }
    const rows = await apiGet('/globals');
    setGlobals(rows);
  };

  const deleteGlobal = async (id: number) => {
    if (!confirm('Delete global variable?')) return;
    await apiDelete(`/globals/${id}`);
    setGlobals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[700px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-semibold">Manage Environments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 text-xs">
          <button
            onClick={() => setActiveSection('environments')}
            className={`px-4 py-2 font-medium border-b-2 ${activeSection === 'environments' ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            Environments
          </button>
          <button
            onClick={() => setActiveSection('globals')}
            className={`px-4 py-2 font-medium border-b-2 ${activeSection === 'globals' ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            Global Variables
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {activeSection === 'environments' && (
            <>
              <div className="flex gap-2 mb-4">
                <button onClick={create} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm">+ New Environment</button>
                {editing && <button onClick={save} className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm">Save</button>}
              </div>

              {editing && (
                <div className="mb-4 space-y-3 bg-gray-800/50 p-3 rounded border border-gray-700">
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Environment Name" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
                  <div className="text-xs text-gray-500">Variables</div>
                  {editing.variables.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="checkbox" checked={v.enabled !== false} onChange={e => updateVar(idx, v.key, v.value, e.target.checked, v.secret)} className="mt-0.5" />
                      <input value={v.key} onChange={e => updateVar(idx, e.target.value, v.value, v.enabled ?? true, v.secret)} placeholder="Variable" className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
                      <input
                        value={v.secret ? '********' : v.value}
                        onChange={e => updateVar(idx, v.key, e.target.value, v.enabled ?? true, v.secret)}
                        onFocus={e => { if (v.secret) e.currentTarget.value = v.value; }}
                        onBlur={e => { if (v.secret) e.currentTarget.value = '********'; }}
                        placeholder="Value"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={v.secret === true}
                          onChange={e => updateVar(idx, v.key, v.value, v.enabled ?? true, e.target.checked)}
                        />
                        Secret
                      </label>
                      <button onClick={() => removeVar(idx)} className="text-gray-500 hover:text-red-400 px-2">×</button>
                    </div>
                  ))}
                  <button onClick={addVar} className="text-blue-400 hover:text-blue-300 text-sm">+ Add Variable</button>
                </div>
              )}

              <div className="space-y-2">
                {environments.map(env => (
                  <div key={env.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{env.name}</span>
                      <span className="text-[10px] text-gray-500">({env.variables?.length || 0} vars)</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing({ ...env, variables: env.variables?.map(v => ({ ...v })) || [] })} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                      <button onClick={() => del(env.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'globals' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">Global variables apply to all requests in all environments.</div>
              {editingGlobals && (
                <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded border border-gray-700">
                  <input
                    id="global-key"
                    placeholder="Key"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                  <input
                    id="global-value"
                    placeholder="Value"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" id="global-secret" />
                    Secret
                  </label>
                  <button
                    onClick={async () => {
                      const key = (document.getElementById('global-key') as HTMLInputElement).value;
                      const value = (document.getElementById('global-value') as HTMLInputElement).value;
                      const secret = (document.getElementById('global-secret') as HTMLInputElement).checked;
                      if (!key) return;
                      await saveGlobal({ id: 0, key, value, secret: secret ? 1 : 0 });
                      (document.getElementById('global-key') as HTMLInputElement).value = '';
                      (document.getElementById('global-value') as HTMLInputElement).value = '';
                      (document.getElementById('global-secret') as HTMLInputElement).checked = false;
                    }}
                    className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm"
                  >
                    Add
                  </button>
                </div>
              )}
              <button
                onClick={() => setEditingGlobals(!editingGlobals)}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm"
              >
                {editingGlobals ? 'Cancel' : '+ New Global Variable'}
              </button>

              <div className="space-y-1">
                {globals.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm text-orange-400 font-mono truncate">{g.key}</span>
                      <span className="text-sm text-gray-300 truncate">{g.secret ? '********' : g.value}</span>
                      {g.secret ? <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0 rounded">secret</span> : null}
                    </div>
                    <button onClick={() => deleteGlobal(g.id)} className="text-red-400 hover:text-red-300 text-sm px-2">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
