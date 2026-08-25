import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function runGit(cwd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30000,
  });
  return {
    code: r.status == null ? 1 : r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim() || (r.error ? r.error.message : ''),
  };
}

export function gitAvailable(): boolean {
  const r = spawnSync('git', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 8000 });
  return r.status === 0;
}

export function assertGitFolder(raw: string): string {
  if (!raw || typeof raw !== 'string') throw new Error('Folder path is required');
  const resolved = path.resolve(raw.trim());
  if (!path.isAbsolute(resolved)) throw new Error('Folder path must be absolute');
  if (!fs.existsSync(resolved)) throw new Error('Folder does not exist: ' + resolved);
  if (!fs.statSync(resolved).isDirectory()) throw new Error('Path is not a folder: ' + resolved);
  return resolved;
}

export function isGitRepo(folder: string): boolean {
  const r = runGit(folder, ['rev-parse', '--is-inside-work-tree']);
  return r.code === 0 && r.stdout === 'true';
}

/** If this repo has no committer identity, set a local one so commits work. */
export function ensureGitIdentity(folder: string) {
  const name = runGit(folder, ['config', 'user.name']);
  if (name.code !== 0 || !name.stdout) {
    runGit(folder, ['config', 'user.name', 'Apiquick']);
  }
  const email = runGit(folder, ['config', 'user.email']);
  if (email.code !== 0 || !email.stdout) {
    runGit(folder, ['config', 'user.email', 'apiquick@local']);
  }
}

export function safeFileName(name: string): string {
  return (name || 'untitled').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'untitled';
}
