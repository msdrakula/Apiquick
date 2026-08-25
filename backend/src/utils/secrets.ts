import { spawnSync } from 'child_process';

const PREFIX = 'dpapi:';

function runPs(script: string): string | null {
  if (process.platform !== 'win32') return null;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000,
  });
  if (r.status !== 0) return null;
  const out = (r.stdout || '').trim();
  return out || null;
}

export function protectSecret(plain: string): string {
  if (!plain || plain.startsWith(PREFIX)) return plain;
  const b64 = Buffer.from(plain, 'utf8').toString('base64');
  const out = runPs(`
    Add-Type -AssemblyName System.Security
    $bytes = [Convert]::FromBase64String('${b64}')
    $prot = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    [Convert]::ToBase64String($prot)
  `);
  return out ? PREFIX + out : plain;
}

export function unprotectSecret(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const payload = value.slice(PREFIX.length);
  const out = runPs(`
    Add-Type -AssemblyName System.Security
    $prot = [Convert]::FromBase64String('${payload}')
    $bytes = [System.Security.Cryptography.ProtectedData]::Unprotect($prot, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    [Convert]::ToBase64String($bytes)
  `);
  if (!out) return value;
  return Buffer.from(out, 'base64').toString('utf8');
}

export function encryptVarList(vars: any[]): any[] {
  if (!Array.isArray(vars)) return vars;
  return vars.map((v) => {
    if (!v || !v.secret || !v.value) return v;
    return { ...v, value: protectSecret(String(v.value)) };
  });
}

export function decryptVarList(vars: any[]): any[] {
  if (!Array.isArray(vars)) return vars;
  return vars.map((v) => {
    if (!v || !v.value) return v;
    return { ...v, value: unprotectSecret(String(v.value)) };
  });
}
