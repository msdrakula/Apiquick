import { get, run } from '../db';

export function getSetting(key: string, fallback = ''): string {
  try {
    const row = get('SELECT value FROM settings WHERE key = ?', [key]);
    return row && row.value != null ? String(row.value) : fallback;
  } catch {
    return fallback;
  }
}

export function setSetting(key: string, value: string): void {
  const existing = get('SELECT key FROM settings WHERE key = ?', [key]);
  if (existing) run('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
  else run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export function getAllowlist(): { enabled: boolean; hosts: string[] } {
  const enabled = getSetting('allowlist_enabled', '0') === '1';
  const hosts = getSetting('allowlist_hosts', '127.0.0.1,localhost')
    .split(/[,;\s]+/)
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return { enabled, hosts };
}

export function isHostAllowed(hostname: string): boolean {
  try {
    const { enabled, hosts } = getAllowlist();
    if (!enabled) return true;
    const host = (hostname || '').toLowerCase();
    return hosts.some((pattern) => {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        return host.endsWith(suffix) || host === pattern.slice(2);
      }
      return host === pattern;
    });
  } catch {
    return true;
  }
}
