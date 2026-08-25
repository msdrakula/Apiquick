"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const secrets_1 = require("../utils/secrets");
const postmanExport_1 = require("../utils/postmanExport");
const router = (0, express_1.Router)();
function parseCollection(row) {
    if (!row)
        return row;
    try {
        row.auth = JSON.parse(row.auth || '{}');
    }
    catch {
        row.auth = {};
    }
    try {
        row.variables = (0, secrets_1.decryptVarList)(JSON.parse(row.variables || '[]'));
    }
    catch {
        row.variables = [];
    }
    return row;
}
router.get('/', (_req, res) => {
    const rows = (0, db_1.all)('SELECT * FROM collections ORDER BY updated_at DESC').map(parseCollection);
    res.json(rows);
});
router.post('/', (req, res) => {
    const { name, description } = req.body;
    (0, db_1.run)('INSERT INTO collections (name, description) VALUES (?, ?)', [name, description || '']);
    const id = (0, db_1.lastId)('collections');
    const row = (id ? (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [id]) : null) ||
        (0, db_1.get)('SELECT * FROM collections ORDER BY id DESC LIMIT 1');
    res.json(parseCollection(row));
});
router.put('/:id', (req, res) => {
    const existing = (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!existing)
        return res.status(404).json({ detail: 'Collection not found' });
    const merged = { ...existing, ...req.body };
    (0, db_1.run)(`
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
        typeof merged.variables === 'string' ? merged.variables : JSON.stringify((0, secrets_1.encryptVarList)(Array.isArray(merged.variables) ? merged.variables : [])),
        req.params.id,
    ]);
    const row = (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    res.json(parseCollection(row));
});
router.delete('/:id', (req, res) => {
    try {
        (0, db_1.run)('DELETE FROM requests WHERE collection_id = ?', [req.params.id]);
        (0, db_1.run)('DELETE FROM collections WHERE id = ?', [req.params.id]);
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Delete failed' });
    }
});
router.post('/import', (req, res) => {
    const { data } = req.body;
    const info = data.info || {};
    (0, db_1.run)('INSERT INTO collections (name, description) VALUES (?, ?)', [info.name || 'Imported Collection', info.description || '']);
    const colId = (0, db_1.lastId)('collections');
    function processItems(items, folder = '') {
        for (const item of items || []) {
            if (item.request) {
                const req = item.request;
                const method = (typeof req.method === 'string' ? req.method : 'GET').toUpperCase();
                let url = '';
                if (typeof req.url === 'string')
                    url = req.url;
                else if (req.url && req.url.raw)
                    url = req.url.raw;
                const headers = JSON.stringify((req.header || []).map((h) => ({
                    key: h.key || '',
                    value: h.value || '',
                    enabled: !h.disabled,
                })));
                const params = JSON.stringify((req.url?.query || []).map((p) => ({
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
                    }
                    else if (mode === 'formdata') {
                        bodyType = 'form_data';
                        bodyContent = JSON.stringify(req.body.formdata || []);
                    }
                    else if (mode === 'urlencoded') {
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
                const pre = events.find((e) => e.listen === 'prerequest');
                const test = events.find((e) => e.listen === 'test');
                const preScript = pre?.script?.exec ? [].concat(pre.script.exec).join('\n') : '';
                const testScript = test?.script?.exec ? [].concat(test.script.exec).join('\n') : '';
                (0, db_1.run)(`
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
    if (data.item)
        processItems(data.item);
    const row = (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [colId]);
    res.json(row);
});
router.post('/:id/duplicate', (req, res) => {
    const col = (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!col)
        return res.status(404).json({ detail: 'Collection not found' });
    const newName = col.name + ' Copy';
    (0, db_1.run)('INSERT INTO collections (name, description) VALUES (?, ?)', [newName, col.description || '']);
    const newColId = (0, db_1.lastId)('collections');
    const requests = (0, db_1.all)('SELECT * FROM requests WHERE collection_id = ?', [req.params.id]);
    for (const r of requests) {
        (0, db_1.run)(`
      INSERT INTO requests (collection_id, name, method, url, headers, params, body_type, body_content, body_raw_type, auth_type, auth, pre_request_script, test_script, grpc_service, grpc_method, grpc_proto, grpc_message, folder, captures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [newColId, r.name, r.method, r.url, r.headers, r.params, r.body_type, r.body_content, r.body_raw_type, r.auth_type, r.auth, r.pre_request_script, r.test_script, r.grpc_service, r.grpc_method, r.grpc_proto, r.grpc_message, r.folder, r.captures || '[]']);
    }
    const row = (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [newColId]);
    res.json(parseCollection(row));
});
router.get('/:id/export', (req, res) => {
    const col = (0, db_1.get)('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!col)
        return res.status(404).json({ detail: 'Collection not found' });
    res.json((0, postmanExport_1.loadCollectionExport)(col));
});
exports.default = router;
//# sourceMappingURL=collections.js.map