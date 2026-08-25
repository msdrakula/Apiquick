import { useState, useEffect } from 'react';
import { Collection, RequestItem } from '../types';
import { apiPost, apiPut } from '../hooks/useApi';

interface Props {
  collections: Collection[];
  currentCollectionId: number | null;
  requestName: string;
  requestData: any;
  onClose: () => void;
  onSaved: (savedReq: RequestItem) => void;
}

export default function SaveRequestModal({ collections, currentCollectionId, requestName, requestData, onClose, onSaved }: Props) {
  const [name, setName] = useState(requestName || '');
  const [colId, setColId] = useState(currentCollectionId || (collections[0]?.id ?? 0));

  useEffect(() => {
    setName(requestName || '');
    setColId(currentCollectionId || (collections[0]?.id ?? 0));
  }, [requestName, currentCollectionId, collections]);

  const save = async () => {
    const payload = { ...requestData, collection_id: colId, name };
    const saved = requestData.id
      ? await apiPut(`/requests/${requestData.id}`, payload)
      : await apiPost('/requests/', payload);
    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[400px] max-w-[95vw]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold">Save Request</h2>
        </div>
        <div className="p-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Request Name" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          <select value={colId} onChange={e => setColId(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded text-sm border border-gray-700 hover:bg-gray-800">Cancel</button>
            <button onClick={save} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
