import { Router } from 'express';
import { run, all } from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = all('SELECT * FROM cookies ORDER BY domain, name');
  res.json(rows);
});

router.post('/', (req, res) => {
  const { domain, name, value, path = '/', secure = 0, http_only = 0, expires } = req.body;
  if (!domain || !name) return res.status(400).json({ error: 'domain and name required' });
  run(
    'INSERT INTO cookies (domain, name, value, path, secure, http_only, expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [domain, name, value || '', path, secure ? 1 : 0, http_only ? 1 : 0, expires || null]
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM cookies WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.delete('/', (_req, res) => {
  run('DELETE FROM cookies');
  res.json({ ok: true });
});

export default router;
