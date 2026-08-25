import { Router } from 'express';
import { run, get, all, lastId } from '../db';
import { decryptVarList, encryptVarList } from '../utils/secrets';

const router = Router();

function parseEnv(row: any) {
  if (!row) return row;
  try { row.variables = decryptVarList(JSON.parse(row.variables || '[]')); } catch {
    try { row.variables = JSON.parse(row.variables || '[]'); } catch { row.variables = []; }
  }
  return row;
}

router.get('/', (_req, res) => {
  const rows = all('SELECT * FROM environments ORDER BY updated_at DESC').map(parseEnv);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, variables } = req.body;
  run('INSERT INTO environments (name, variables) VALUES (?, ?)', [name, JSON.stringify(encryptVarList(variables || []))]);
  const row = get('SELECT * FROM environments WHERE id = ?', [lastId('environments')]);
  res.json(parseEnv(row));
});

router.put('/:id', (req, res) => {
  const { name, variables } = req.body;
  run('UPDATE environments SET name = ?, variables = ? WHERE id = ?', [name, JSON.stringify(encryptVarList(variables || [])), req.params.id]);
  const row = get('SELECT * FROM environments WHERE id = ?', [req.params.id]);
  res.json(parseEnv(row));
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM environments WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
