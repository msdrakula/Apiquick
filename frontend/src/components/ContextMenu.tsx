import { useEffect, useRef } from 'react';

export interface MenuItem {
  label: string;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean;
  onClick: () => void;
}

interface Props {
  items: MenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export default function ContextMenu({ items, x, y, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to keep inside viewport
  const rect = ref.current?.getBoundingClientRect();
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  let left = x;
  let top = y;
  const menuW = rect?.width ?? 200;
  const menuH = rect?.height ?? 200;
  if (left + menuW > winW) left = winW - menuW - 8;
  if (top + menuH > winH) top = winH - menuH - 8;

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[100] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px] text-sm"
    >
      {items.map((item, idx) =>
        item.divider ? (
          <div key={idx} className="my-1 border-t border-gray-700" />
        ) : (
          <button
            key={idx}
            onClick={() => { item.onClick(); onClose(); }}
            className={`
              w-full text-left px-3 py-1.5 flex items-center justify-between
              hover:bg-gray-800 transition-colors
              ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-200'}
            `}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-500 ml-4">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
