import { Tab } from '../types';
import { methodColor } from '../lib/parse';

interface Props {
  tabs: Tab[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export default function TabBar({ tabs, activeTabId, onSelect, onClose }: Props) {
  return (
    <div className="flex items-center bg-[#12151c] border-b border-[#1e2430] overflow-x-auto scrollbar-hide">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          onMouseDown={e => {
            if (e.button === 1) {
              e.preventDefault();
              onClose(tab.id);
            }
          }}
          className={`
            group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-[#1e2430] select-none whitespace-nowrap min-w-[140px] max-w-[240px]
            ${activeTabId === tab.id ? 'bg-[#1a1e28] text-zinc-100 border-b-2 border-b-[#ff6c37]' : 'text-zinc-500 hover:bg-[#161a22] hover:text-zinc-200'}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tab.dirty ? 'bg-[#ff6c37]' : 'bg-transparent'}`} />
          <span className={`text-[10px] font-bold ${methodColor(tab.request?.method)}`}>{tab.request?.method || 'GET'}</span>
          <span className="truncate flex-1 min-w-0">{tab.request?.name || 'Untitled'}</span>
          <button
            onClick={e => { e.stopPropagation(); onClose(tab.id); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 px-1 rounded"
          >
            ×
          </button>
        </div>
      ))}
      <div className="flex-1" />
    </div>
  );
}
