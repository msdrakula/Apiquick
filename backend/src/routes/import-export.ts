import { Router } from 'express';
import { run, get, lastId } from '../db';

const { bruToJsonV2, jsonToBruV2 } = require('@usebruno/lang');

const router = Router();

// Import a .bru file into a collection
router.post('/bru', (req, res) => {
  try {
    const { collectionId, bruText } = req.body;
    if (!collectionId || !bruText) {
      return res.status(400).json({ error: 'collectionId and bruText required' });
    }

    const parsed = bruToJsonV2(bruText);
    const http = parsed.http || parsed.get || parsed.post || parsed.put || parsed.patch || parsed.delete || {};
    const method = http.method || (parsed.get ? 'GET' : parsed.post ? 'POST' : parsed.put ? 'PUT' : parsed.patch ? 'PATCH' : parsed.delete ? 'DELETE' : 'GET');
    const url = http.url || '';

    const headers = Object.entries(parsed.headers || {}).map(([key, value]: [string, any]) => ({
      key,
      value: String(value).replace(/^~/, ''),
      enabled: !String(value).startsWith('~'),
    }));

    const params: any[] = [];

    const name = parsed.meta?.name || 'Imported Request';
    const bodyType = http.body === 'none' ? 'none' : parsed.body ? 'raw' : 'none';
    const bodyContent = parsed.body ? Object.values(parsed.body)[0] as string : '';
    const bodyRawType = parsed.body ? Object.keys(parsed.body)[0] : 'json';

    const preRequestScript = parsed.script?.preRequest || parsed['script:pre-request'] || '';
    const testScript = parsed.tests || '';

    run(`
      INSERT INTO requests (collection_id, name, method, url, headers, params, body_type, body_content, body_raw_type, pre_request_script, test_script)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      collectionId,
      name,
      method,
      url,
      JSON.stringify(headers),
      JSON.stringify(params),
      bodyType,
      bodyContent,
      bodyRawType,
      preRequestScript,
      testScript,
    ]);

    const id = lastId('requests');
    res.json({ id, name, message: 'Imported successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export a request to .bru format
router.get('/bru/:requestId', (req, res) => {
  try {
    const row = get('SELECT * FROM requests WHERE id = ?', [req.params.requestId]);
    if (!row) return res.status(404).json({ error: 'Request not found' });

    const headers: Record<string, string> = {};
    try {
      const h = JSON.parse(row.headers || '[]');
      for (const item of h) {
        const prefix = item.enabled === false ? '~' : '';
        headers[`${prefix}${item.key}`] = item.value;
      }
    } catch { /* ignore */ }

    const json = {
      meta: {
        name: row.name,
        type: 'http',
        seq: 1,
      },
      http: {
        method: row.method,
        url: row.url,
        body: row.body_type === 'none' ? 'none' : row.body_raw_type || 'json',
        auth: row.auth_type === 'none' ? 'none' : row.auth_type,
      },
      headers,
      body: row.body_type !== 'none' && row.body_content ? { [row.body_raw_type || 'json']: row.body_content } : undefined,
      script: {
        preRequest: row.pre_request_script || undefined,
      },
      tests: row.test_script || undefined,
    };

    const bruText = jsonToBruV2(json);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${row.name.replace(/\s+/g, '_')}.bru"`);
    res.send(bruText);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
