import { useRef, useEffect } from 'react';
import { BUILTIN_GENERATORS } from '../utils/generators';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  availableVars?: Set<string>;
}

function highlightText(text: string, availableVars?: Set<string>) {
  const parts: Array<{ text: string; type: 'normal' | 'var' | 'missing' | 'builtin' }> = [];
  const regex = /(\{\{\$counter(?::[^}]+)?\}\}|\{\{[^}]+\}\})/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), type: 'normal' });
    }
    const varName = match[1].slice(2, -2);
    const isBuiltin = BUILTIN_GENERATORS.has(varName) || varName === '$counter' || varName.startsWith('$counter:');
    const isAvailable = availableVars?.has(varName);
    let type: 'var' | 'missing' | 'builtin' = 'missing';
    if (isBuiltin) type = 'builtin';
    else if (isAvailable) type = 'var';
    parts.push({ text: match[1], type });
    lastIndex = match.index + match[1].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), type: 'normal' });
  }
  if (parts.length === 0) {
    parts.push({ text, type: 'normal' });
  }

  return parts;
}

const textLayer =
  'text-sm font-normal leading-5 tracking-normal px-3 py-1.5 whitespace-nowrap';

export default function HighlightedInput({ value, onChange, onKeyDown, placeholder, className = '', availableVars }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const syncScroll = () => {
    if (inputRef.current && backdropRef.current) {
      backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    syncScroll();
  }, [value]);

  const parts = highlightText(value, availableVars);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={backdropRef}
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${textLayer}`}
        aria-hidden="true"
      >
        {parts.map((part, i) => {
          let cls = 'text-gray-200';
          if (part.type === 'var') cls = 'text-green-400 bg-green-400/10';
          else if (part.type === 'builtin') cls = 'text-blue-400 bg-blue-400/10';
          else if (part.type === 'missing') cls = 'text-red-400 bg-red-400/10';
          return (
            <span key={i} className={cls}>
              {part.text || '\u00A0'}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        placeholder={placeholder}
        className={`highlighted-input-field relative w-full h-full bg-transparent outline-none caret-white ${textLayer}`}
        style={{ color: 'transparent', caretColor: 'white', WebkitTextFillColor: 'transparent' }}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
