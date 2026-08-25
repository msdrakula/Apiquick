import { Router } from 'express';
import { getAllowlist, getSetting, setSetting } from '../utils/settings';

const router = Router();

router.get('/', (_req, res) => {
  const allow = getAllowlist();
  res.json({
    allowlistEnabled: allow.enabled,
    allowlistHosts: getSetting('allowlist_hosts', '127.0.0.1,localhost'),
  });
});

router.put('/', (req, res) => {
  if (req.body.allowlistEnabled != null) {
    setSetting('allowlist_enabled', req.body.allowlistEnabled ? '1' : '0');
  }
  if (typeof req.body.allowlistHosts === 'string') {
    setSetting('allowlist_hosts', req.body.allowlistHosts);
  }
  const allow = getAllowlist();
  res.json({
    allowlistEnabled: allow.enabled,
    allowlistHosts: getSetting('allowlist_hosts', '127.0.0.1,localhost'),
  });
});

export default router;
