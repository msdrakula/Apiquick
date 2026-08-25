import { useState } from 'react';

interface Props {
  data: string | any;
  initialExpanded?: boolean;
}

const COLORS = {
  key: 'text-orange-400',
  string: 'text-green-400',
  number: 'text-blue-400',
  boolean: 'text-purple-400',
  null: 'text-gray-500',
  bracket: 'text-gray-400',
  count: 'text-gray-500 text-[10px]',
};

function isArray(v: any) {
  return Array.isArray(v);
}

function getType(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  if (isArray(value)) return 'array';
  return 'object';
}

function formatValue(value: any): { text: string; color: string } {
  const type = getType(value);
  switch (type) {
    case 'null':
      return { text: 'null', color: COLORS.null };
    case 'boolean':
      return { text: String(value), color: COLORS.boolean };
    case 'number':
      return { text: String(value), color: COLORS.number };
    case 'string':
      return { text: `"${value}"`, color: COLORS.string };
    default:
      return { text: '', color: '' };
  }
}

interface TreeNodeProps {
  name?: string;
  value: any;
  depth: number;
  defaultExpanded?: boolean;
}

function TreeNode({ name, value, depth, defaultExpanded = false }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const type = getType(value);
  const isExpandable = type === 'object' || type === 'array';
  const keys = isExpandable ? Object.keys(value) : [];
  const isEmpty = keys.length === 0;

  const indent = depth * 16;

  if (!isExpandable) {
    const formatted = formatValue(value);
    return (
      <div className="font-mono text-[12px] leading-5" style={{ paddingLeft: indent }}>
        {name !== undefined && (
          <>
            <span className={COLORS.key}>"{name}"</span>
            <span className="text-gray-500">: </span>
          </>
        )}
        <span className={formatted.color}>{formatted.text}</span>
      </div>
    );
  }

  const openBracket = type === 'array' ? '[' : '{';
  const closeBracket = type === 'array' ? ']' : '}';

  if (isEmpty) {
    return (
      <div className="font-mono text-[12px] leading-5" style={{ paddingLeft: indent }}>
        {name !== undefined && (
          <>
            <span className={COLORS.key}>"{name}"</span>
            <span className="text-gray-500">: </span>
          </>
        )}
        <span className={COLORS.bracket}>{openBracket}{closeBracket}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="font-mono text-[12px] leading-5 cursor-pointer hover:bg-gray-800/50 rounded select-none"
        style={{ paddingLeft: indent }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-gray-500 inline-block w-3">{expanded ? '▼' : '▶'}</span>
        {name !== undefined && (
          <>
            <span className={COLORS.key}>"{name}"</span>
            <span className="text-gray-500">: </span>
          </>
        )}
        <span className={COLORS.bracket}>{openBracket}</span>
        {!expanded && (
          <span className={COLORS.count}>
            {type === 'array' ? `${keys.length} items` : `${keys.length} keys`}
          </span>
        )}
        {!expanded && <span className={COLORS.bracket}>{closeBracket}</span>}
      </div>

      {expanded && (
        <div>
          {keys.map((key, idx) => (
            <div key={key}>
              <TreeNode
                name={type === 'array' ? undefined : key}
                value={value[key]}
                depth={depth + 1}
                defaultExpanded={depth < 2}
              />
              {idx < keys.length - 1 && (
                <div style={{ paddingLeft: indent + 16 }} className="text-gray-600 text-[10px] select-none">,</div>
              )}
            </div>
          ))}
          <div className="font-mono text-[12px] leading-5" style={{ paddingLeft: indent }}>
            <span className={COLORS.bracket}>{closeBracket}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JSONTree({ data, initialExpanded = true }: Props) {
  let parsed: any;
  try {
    parsed = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return <div className="text-red-400 text-sm p-4">Invalid JSON</div>;
  }

  if (parsed === null || typeof parsed !== 'object') {
    const formatted = formatValue(parsed);
    return (
      <div className="p-4 font-mono text-[12px]">
        <span className={formatted.color}>{formatted.text}</span>
      </div>
    );
  }

  return (
    <div className="p-3 overflow-auto h-full">
      <TreeNode value={parsed} depth={0} defaultExpanded={initialExpanded} />
    </div>
  );
}
