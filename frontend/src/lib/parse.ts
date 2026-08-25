export function parseMaybe<T>(value: any, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function methodColor(method: string | null | undefined) {
  const m = (method || '').toUpperCase();
  if (m === 'GET') return 'text-emerald-400';
  if (m === 'POST') return 'text-amber-400';
  if (m === 'PUT') return 'text-sky-400';
  if (m === 'DELETE') return 'text-rose-400';
  if (m === 'PATCH') return 'text-violet-400';
  if (m === 'HEAD') return 'text-teal-400';
  if (m === 'OPTIONS') return 'text-indigo-400';
  if (m === 'WS') return 'text-pink-400';
  if (m === 'GRPC') return 'text-cyan-400';
  return 'text-zinc-400';
}

export function methodChip(method: string | null | undefined) {
  const m = (method || 'GET').toUpperCase();
  return `text-[10px] font-bold tracking-wide ${methodColor(m)}`;
}
