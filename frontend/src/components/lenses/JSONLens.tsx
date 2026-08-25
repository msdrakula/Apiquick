import { useState } from 'react';
import MonacoEditor from '../MonacoEditor';
import JSONTree from '../JSONTree';

interface Props {
  body: string;
}

export default function JSONLens({ body }: Props) {
  const [mode, setMode] = useState<'tree' | 'raw'>('tree');

  let pretty = body;
  try {
    pretty = JSON.stringify(JSON.parse(body), null, 2);
  } catch { /* leave as-is */ }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-800">
        <button
          onClick={() => setMode('tree')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${mode === 'tree' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
        >
          Tree
        </button>
        <button
          onClick={() => setMode('raw')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${mode === 'raw' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
        >
          Raw
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {mode === 'tree' ? (
          <JSONTree data={body} />
        ) : (
          <MonacoEditor value={pretty} onChange={() => {}} language="json" height="100%" readOnly />
        )}
      </div>
    </div>
  );
}
