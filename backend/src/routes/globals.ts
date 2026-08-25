import { Router } from 'express';
import { run, get, all } from '../db';
import { protectSecret, unprotectSecret } from '../utils/secrets';

const router = Router();

function parseGlobal(row: any) {
  if (!row) return row;
  return { ...row, value: unprotectSecret(row.value) };
}

router.get('/', (_req, res) => {
  res.json(all('SELECT * FROM globals ORDER BY key').map(parseGlobal));
});

router.post('/', (req, res) => {
  const { key, value, secret } = req.body;
  if (!key) return res.status(400).json({ error: 'Key is required' });
  const stored = secret ? protectSecret(value || '') : (value || '');
  run('INSERT INTO globals (key, value, secret) VALUES (?, ?, ?)', [key, stored, secret ? 1 : 0]);
  const row = get('SELECT * FROM globals WHERE key = ?', [key]);
  res.json(parseGlobal(row));
});

router.put('/:id', (req, res) => {
  const { key, value, secret } = req.body;
  const stored = secret ? protectSecret(value || '') : (value || '');
  run('UPDATE globals SET key = ?, value = ?, secret = ? WHERE id = ?', [key, stored, secret ? 1 : 0, req.params.id]);
  const row = get('SELECT * FROM globals WHERE id = ?', [req.params.id]);
  res.json(parseGlobal(row));
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM globals WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
