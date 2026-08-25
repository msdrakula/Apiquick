interface Props {
  authType: string;
  auth: Record<string, any>;
  onChange: (type: string, auth: Record<string, any>) => void;
}

export default function AuthPanel({ authType, auth, onChange }: Props) {
  const safeType = authType || 'none';
  const safeAuth = typeof auth === 'object' && auth !== null ? auth : {};

  const setType = (type: string) => {
    onChange(type, safeAuth);
  };

  const update = (key: string, value: string) => {
    onChange(safeType, { ...safeAuth, [key]: value });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 mb-2 flex-wrap">
        {['none', 'basic', 'bearer', 'apikey', 'oauth2', 'digest'].map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1 rounded text-sm capitalize ${safeType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {safeType === 'none' && <div className="text-gray-500 text-sm">No authentication selected</div>}

      {safeType === 'basic' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Username</label>
            <input value={safeAuth.username || ''} onChange={e => update('username', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input type="password" value={safeAuth.password || ''} onChange={e => update('password', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      {safeType === 'bearer' && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">Token</label>
          <input value={safeAuth.token || ''} onChange={e => update('token', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" placeholder="Bearer token" />
        </div>
      )}

      {safeType === 'apikey' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Key</label>
            <input value={safeAuth.key || ''} onChange={e => update('key', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Value</label>
            <input value={safeAuth.value || ''} onChange={e => update('value', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Add to</label>
            <select value={safeAuth.addTo || 'header'} onChange={e => update('addTo', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </div>
      )}

      {safeType === 'oauth2' && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">Access Token</label>
          <input value={safeAuth.accessToken || ''} onChange={e => update('accessToken', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" placeholder="OAuth2 access token" />
        </div>
      )}

      {safeType === 'digest' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Username</label>
            <input value={safeAuth.username || ''} onChange={e => update('username', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input type="password" value={safeAuth.password || ''} onChange={e => update('password', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
