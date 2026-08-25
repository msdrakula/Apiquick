import { get, run } from '../db';

const mem: Record<string, number> = {};

export function peekCounter(name: string): number {
  try {
    const row = get('SELECT value FROM counters WHERE name = ?', [name]);
    return row ? Number(row.value) || 0 : 0;
  } catch {
    return mem[name] || 0;
  }
}

export function bumpCounter(name: string): number {
  const current = peekCounter(name);
  const next = current + 1;
  try {
    const existing = get('SELECT name FROM counters WHERE name = ?', [name]);
    if (existing) run('UPDATE counters SET value = ? WHERE name = ?', [next, name]);
    else run('INSERT INTO counters (name, value) VALUES (?, ?)', [name, next]);
  } catch {
    mem[name] = next;
  }
  return next;
}

export function makeCounterCtx(increment: boolean) {
  const cache: Record<string, string> = {};
  return {
    value(name: string) {
      const key = name || 'default';
      if (cache[key] != null) return cache[key];
      const n = increment ? bumpCounter(key) : peekCounter(key) + 1;
      cache[key] = String(n);
      return cache[key];
    },
  };
}
