import { all } from '../db';

function parseJson(value: any, fallback: any) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

export function collectionToPostman(col: any, requests: any[]) {
  const groups = new Map<string, any[]>();
  for (const req of requests || []) {
    const folder = req.folder || '';
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder)!.push(req);
  }

  function toItem(req: any) {
    const headers = parseJson(req.headers, []);
    const params = parseJson(req.params, []);
    return {
      name: req.name,
      request: {
        method: req.method,
        header: headers,
        url: { raw: req.url, host: [req.url], query: params },
        body: {
          mode: req.body_type === 'raw' ? 'raw' : req.body_type === 'form_data' ? 'formdata' : req.body_type === 'x_form' ? 'urlencoded' : 'none',
          raw: req.body_content,
          options: { raw: { language: req.body_raw_type } },
          formdata: req.body_type === 'form_data' ? parseJson(req.body_content, []) : [],
          urlencoded: req.body_type === 'x_form' ? parseJson(req.body_content, []) : [],
        },
      },
    };
  }

  const items: any[] = [];
  const folders = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  for (const folder of folders) {
    const reqs = groups.get(folder)!.map(toItem);
    if (!folder) items.push(...reqs);
    else items.push({ name: folder, item: reqs });
  }

  return {
    info: {
      _postman_id: `apiquick-${col.id}`,
      name: col.name,
      description: col.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: items,
  };
}

export function loadCollectionExport(col: any) {
  const requests = all('SELECT * FROM requests WHERE collection_id = ? ORDER BY folder, id', [col.id]);
  return collectionToPostman(col, requests);
}
