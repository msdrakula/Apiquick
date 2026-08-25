import { Router } from 'express';
import { run, get, all, lastId } from '../db';
import { decryptVarList, encryptVarList } from '../utils/secrets';
import { loadCollectionExport } from '../utils/postmanExport';

const router = Router();

function parseCollection(row: any) {
  if (!row) return row;
  try { row.auth = JSON.parse(row.auth || '{}'); } catch { row.auth = {}; }
  try { row.variables = decryptVarList(JSON.parse(row.variables || '[]')); } catch { row.variables = []; }
  return row;
}

router.get('/', (_req, res) => {
  const rows = all('SELECT * FROM collections ORDER BY updated_at DESC').map(parseCollection);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  run('INSERT INTO collections (name, description) VALUES (?, ?)', [name, description || '']);
  const id = lastId('collections');
  const row =
    (id ? get('SELECT * FROM collections WHERE id = ?', [id]) : null) ||
    get('SELECT * FROM collections ORDER BY id DESC LIMIT 1');
  res.json(parseCollection(row));
});

router.put('/:id', (req, res) => {
  const existing = get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ detail: 'Collection not found' });
  const merged = { ...existing, ...req.body };
  run(`
    UPDATE collections SET
      name = ?,
      description = ?,
      auth_type = ?,
      auth = ?,
      pre_request_script = ?,
      test_script = ?,
      variables = ?
    WHERE id = ?
  `, [
    merged.name ?? '',
    merged.description ?? '',
    merged.auth_type ?? 'none',
    typeof merged.auth === 'string' ? merged.auth : JSON.stringify(merged.auth ?? {}),
    merged.pre_request_script ?? '',
    merged.test_script ?? '',
    typeof merged.variables === 'string' ? merged.variables : JSON.stringify(encryptVarList(Array.isArray(merged.variables) ? merged.variables : [])),
    req.params.id,
  ]);
  const row = get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
  res.json(parseCollection(row));
});

router.delete('/:id', (req, res) => {
  try {
    run('DELETE FROM requests WHERE collection_id = ?', [req.params.id]);
    run('DELETE FROM collections WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

router.post('/import', (req, res) => {
  const { data } = req.body;
  const info = data.info || {};
  run('INSERT INTO collections (name, description) VALUES (?, ?)', [info.name || 'Imported Collection', info.description || '']);
  const colId = lastId('collections');

  function processItems(items: any[], folder = '') {
    for (const item of items || []) {
      if (item.request) {
        const req = item.request;
        const method = (typeof req.method === 'string' ? req.method : 'GET').toUpperCase();
        let url = '';
        if (typeof req.url === 'string') url = req.url;
        else if (req.url && req.url.raw) url = req.url.raw;

        const headers = JSON.stringify((req.header || []).map((h: any) => ({
          key: h.key || '',
          value: h.value || '',
          enabled: !h.disabled,
        })));

        const params = JSON.stringify((req.url?.query || []).map((p: any) => ({
          key: p.key || '',
          value: p.value || '',
          enabled: !p.disabled,
        })));

        let bodyType = 'none';
        let bodyContent = '';
        let bodyRawType = 'json';
        if (req.body) {
          const mode = req.body.mode;
          if (mode === 'raw') {
            bodyType = 'raw';
            bodyContent = req.body.raw || '';
            bodyRawType = req.body.options?.raw?.language || 'json';
          } else if (mode === 'formdata') {
            bodyType = 'form_data';
            bodyContent = JSON.stringify(req.body.formdata || []);
          } else if (mode === 'urlencoded') {
            bodyType = 'x_form';
            bodyContent = JSON.stringify(req.body.urlencoded || []);
          }
        }

        let authType = 'none';
        let auth = '{}';
        if (req.auth && req.auth.type && req.auth.type !== 'noauth') {
          authType = req.auth.type === 'noauth' ? 'none' : req.auth.type;
          auth = JSON.stringify(req.auth);
        }

        const events = req.event || item.event || [];
        const pre = events.find((e: any) => e.listen === 'prerequest');
        const test = events.find((e: any) => e.listen === 'test');
        const preScript = pre?.script?.exec ? [].concat(pre.script.exec).join('\n') : '';
        const testScript = test?.script?.exec ? [].concat(test.script.exec).join('\n') : '';

        run(`
          INSERT INTO requests (collection_id, name, method, url, headers, params, body_type, body_content, body_raw_type, auth_type, auth, pre_request_script, test_script, folder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [colId, item.name || 'Request', method, url, headers, params, bodyType, bodyContent, bodyRawType, authType, auth, preScript, testScript, folder]);
      }
      if (item.item) {
        const nextFolder = folder ? `${folder}/${item.name}` : (item.request ? folder : item.name);
        processItems(item.item, item.request ? folder : nextFolder);
      }
    }
  }

  if (data.item) processItems(data.item);
  const row = get('SELECT * FROM collections WHERE id = ?', [colId]);
  res.json(row);
});

router.post('/:id/duplicate', (req, res) => {
  const col = get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
  if (!col) return res.status(404).json({ detail: 'Collection not found' });

  const newName = col.name + ' Copy';
  run('INSERT INTO collections (name, description) VALUES (?, ?)', [newName, col.description || '']);
  const newColId = lastId('collections');

  const requests = all('SELECT * FROM requests WHERE collection_id = ?', [req.params.id]);
  for (const r of requests) {
    run(`
      INSERT INTO requests (collection_id, name, method, url, headers, params, body_type, body_content, body_raw_type, auth_type, auth, pre_request_script, test_script, grpc_service, grpc_method, grpc_proto, grpc_message, folder, captures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [newColId, r.name, r.method, r.url, r.headers, r.params, r.body_type, r.body_content, r.body_raw_type, r.auth_type, r.auth, r.pre_request_script, r.test_script, r.grpc_service, r.grpc_method, r.grpc_proto, r.grpc_message, r.folder, r.captures || '[]']);
  }

  const row = get('SELECT * FROM collections WHERE id = ?', [newColId]);
  res.json(parseCollection(row));
});

router.get('/:id/export', (req, res) => {
  const col = get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
  if (!col) return res.status(404).json({ detail: 'Collection not found' });
  res.json(loadCollectionExport(col));
});

export default router;
