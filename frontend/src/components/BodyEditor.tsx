import { useState, useEffect } from 'react';
import MonacoEditor from './MonacoEditor';

interface Props {
  bodyType: string;
  bodyContent: string;
  bodyRawType: string;
  onChange: (type: string, content: string, rawType: string) => void;
}

export default function BodyEditor({ bodyType, bodyContent, bodyRawType, onChange }: Props) {
  const [text, setText] = useState(bodyContent ?? '');

  useEffect(() => { setText(bodyContent); }, [bodyContent]);

  const getLang = () => {
    switch (bodyRawType) {
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'html': return 'html';
      default: return 'plaintext';
    }
  };

  return (
    <div className="p-4 flex-1 flex flex-col min-h-0">
      <div className="flex gap-2 mb-3 flex-wrap">
        {['none', 'raw', 'form_data', 'x_form'].map(t => (
          <button
            key={t}
            onClick={() => onChange(t, text, bodyRawType)}
            className={`px-3 py-1 rounded text-sm ${bodyType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {t === 'none' ? 'None' : t === 'raw' ? 'Raw' : t === 'form_data' ? 'form-data' : 'x-www-form-urlencoded'}
          </button>
        ))}
      </div>

      {bodyType === 'none' && <div className="text-gray-500 text-sm italic">No body selected</div>}

      {bodyType === 'raw' && (
        <div className="flex-1 flex flex-col min-h-0">
          <select
            value={bodyRawType}
            onChange={e => onChange(bodyType, text, e.target.value)}
            className="w-40 bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm mb-2"
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="xml">XML</option>
            <option value="html">HTML</option>
          </select>
          <div className="flex-1 min-h-0">
            <MonacoEditor
              value={text}
              onChange={v => { setText(v); onChange(bodyType, v, bodyRawType); }}
              language={getLang()}
              height="100%"
            />
          </div>
        </div>
      )}

      {(bodyType === 'form_data' || bodyType === 'x_form') && (
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); onChange(bodyType, e.target.value, bodyRawType); }}
          className="flex-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 resize-none"
          placeholder={bodyType === 'form_data' ? '[{"key":"","value":"","enabled":true}]' : 'key=value&key2=value2'}
        />
      )}
    </div>
  );
}
