import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { all } from '../db';
import { getSetting, setSetting } from '../utils/settings';
import { assertGitFolder, ensureGitIdentity, gitAvailable, isGitRepo, runGit, safeFileName } from '../utils/git';
import { decryptVarList } from '../utils/secrets';
import { loadCollectionExport } from '../utils/postmanExport';

const router = Router();

function folderOrThrow() {
  return assertGitFolder(getSetting('git_folder', ''));
}

function statusPayload(folder: string) {
  const available = gitAvailable();
  const repo = available && isGitRepo(folder);
  let branch = '';
  let files: string[] = [];
  let porcelain = '';
  if (repo) {
    const b = runGit(folder, ['rev-parse', '--abbrev-ref', 'HEAD']);
    branch = b.stdout || '';
    const st = runGit(folder, ['status', '--porcelain']);
    porcelain = st.stdout;
    files = porcelain ? porcelain.split(/\r?\n/).filter(Boolean) : [];
  }
  return { folder, available, repo, branch, files, dirty: files.length > 0 };
}

router.get('/status', (_req, res) => {
  try {
    const saved = getSetting('git_folder', '');
    if (!saved) return res.json({ folder: '', available: gitAvailable(), repo: false, branch: '', files: [], dirty: false });
    const folder = assertGitFolder(saved);
    res.json(statusPayload(folder));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/folder', (req, res) => {
  try {
    const folder = assertGitFolder(req.body?.path || '');
    setSetting('git_folder', folder);
    res.json(statusPayload(folder));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/init', (_req, res) => {
  try {
    if (!gitAvailable()) return res.status(400).json({ error: 'git is not installed or not on PATH' });
    const folder = folderOrThrow();
    if (isGitRepo(folder)) {
      ensureGitIdentity(folder);
      return res.json({ ok: true, ...statusPayload(folder) });
    }
    const r = runGit(folder, ['init']);
    if (r.code !== 0) return res.status(500).json({ error: r.stderr || 'git init failed' });
    ensureGitIdentity(folder);
    const gi = path.join(folder, '.gitignore');
    if (!fs.existsSync(gi)) fs.writeFileSync(gi, '.DS_Store\nThumbs.db\n', 'utf8');
    res.json({ ok: true, ...statusPayload(folder) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/sync', (_req, res) => {
  try {
    const folder = folderOrThrow();
    const colDir = path.join(folder, 'collections');
    const envDir = path.join(folder, 'environments');
    fs.mkdirSync(colDir, { recursive: true });
    fs.mkdirSync(envDir, { recursive: true });

    const collections = all('SELECT * FROM collections ORDER BY id');
    const written: string[] = [];
    for (const col of collections) {
      const data = loadCollectionExport(col);
      const file = path.join(colDir, safeFileName(col.name) + '.postman_collection.json');
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      written.push(path.relative(folder, file));
    }

    const envs = all('SELECT * FROM environments ORDER BY id');
    for (const env of envs) {
      let variables: any[] = [];
      try { variables = JSON.parse(env.variables || '[]'); } catch { variables = []; }
      variables = decryptVarList(Array.isArray(variables) ? variables : []).map((v: any) => (
        v && v.secret ? { ...v, value: '' } : v
      ));
      const file = path.join(envDir, safeFileName(env.name) + '.json');
      fs.writeFileSync(file, JSON.stringify({ name: env.name, variables }, null, 2), 'utf8');
      written.push(path.relative(folder, file));
    }

    res.json({ ok: true, written, ...statusPayload(folder) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/commit', (req, res) => {
  try {
    if (!gitAvailable()) return res.status(400).json({ error: 'git is not installed or not on PATH' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Commit message is required' });
    const folder = folderOrThrow();
    if (!isGitRepo(folder)) return res.status(400).json({ error: 'Folder is not a git repository. Click Init first.' });
    ensureGitIdentity(folder);

    const add = runGit(folder, ['add', '-A']);
    if (add.code !== 0) return res.status(500).json({ error: add.stderr || 'git add failed' });

    const commit = runGit(folder, ['commit', '-m', message]);
    if (commit.code !== 0) {
      const text = (commit.stderr || commit.stdout || 'git commit failed');
      if (/nothing to commit/i.test(text)) return res.json({ ok: true, empty: true, ...statusPayload(folder) });
      return res.status(500).json({ error: text });
    }
    res.json({ ok: true, log: commit.stdout, ...statusPayload(folder) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
