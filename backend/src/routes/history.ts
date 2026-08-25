import { Router } from 'express';
import { run, all } from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = all('SELECT * FROM history ORDER BY executed_at DESC LIMIT 200');
  res.json(rows);
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM history WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.delete('/', (_req, res) => {
  run('DELETE FROM history');
  res.json({ ok: true });
});

export default router;
