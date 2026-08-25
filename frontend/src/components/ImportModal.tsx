import { useState } from 'react';
import { apiPost } from '../hooks/useApi';
import MonacoEditor from './MonacoEditor';

interface Props {
  onClose: () => void;
  onImport: () => void;
}

export default function ImportModal({ onClose, onImport }: Props) {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  const handleImport = async () => {
    try {
      const data = JSON.parse(json);
      await apiPost('/collections/import', { data });
      setJson('');
      setError('');
      onImport();
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[500px] max-w-[95vw]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-semibold">Import Collection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>
        <div className="p-4">
          <div className="h-64">
            <MonacoEditor value={json} onChange={setJson} language="json" height="100%" />
          </div>
          {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={onClose} className="px-4 py-2 rounded text-sm border border-gray-700 hover:bg-gray-800">Cancel</button>
            <button onClick={handleImport} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm">Import</button>
          </div>
        </div>
      </div>
    </div>
  );
}
