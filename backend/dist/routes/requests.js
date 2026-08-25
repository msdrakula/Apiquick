"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
function parseRequest(row) {
    return row;
}
router.get('/', (_req, res) => {
    res.json((0, db_1.all)('SELECT * FROM requests ORDER BY collection_id, folder, id'));
});
router.get('/collection/:collection_id', (req, res) => {
    const rows = (0, db_1.all)('SELECT * FROM requests WHERE collection_id = ? ORDER BY folder, id', [req.params.collection_id]);
    res.json(rows);
});
router.get('/:id', (req, res) => {
    const row = (0, db_1.get)('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    if (!row)
        return res.status(404).json({ detail: 'Request not found' });
    res.json(parseRequest(row));
});
const REQUEST_COLS = `collection_id, name, method, url, headers, params, body_type, body_content, body_raw_type, auth_type, auth, pre_request_script, test_script, grpc_service, grpc_method, grpc_proto, grpc_message, folder, captures`;
function asJson(value, fallback) {
    if (typeof value === 'string') {
        try {
            JSON.parse(value);
            return value;
        }
        catch {
            return JSON.stringify(fallback);
        }
    }
    return JSON.stringify(value ?? fallback);
}
function requestValues(data) {
    return [
        data.collection_id,
        data.name || 'New Request',
        data.method || 'GET',
        data.url || '',
        asJson(data.headers, []),
        asJson(data.params, []),
        data.body_type || 'none',
        data.body_content || '',
        data.body_raw_type || 'json',
        data.auth_type || 'none',
        asJson(data.auth, {}),
        data.pre_request_script || '',
        data.test_script || '',
        data.grpc_service || '',
        data.grpc_method || '',
        data.grpc_proto || '',
        data.grpc_message || '',
        data.folder || '',
        asJson(data.captures, []),
    ];
}
router.post('/', (req, res) => {
    try {
        const data = req.body;
        if (data.collection_id == null) {
            return res.status(400).json({ error: 'collection_id required' });
        }
        try {
            (0, db_1.run)(`INSERT INTO requests (${REQUEST_COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, requestValues(data));
        }
        catch {
            (0, db_1.run)(`
        INSERT INTO requests (collection_id, name, method, url, headers, params, body_type, body_content, body_raw_type, auth_type, auth, pre_request_script, test_script)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                data.collection_id,
                data.name || 'New Request',
                data.method || 'GET',
                data.url || '',
                asJson(data.headers, []),
                asJson(data.params, []),
                data.body_type || 'none',
                data.body_content || '',
                data.body_raw_type || 'json',
                data.auth_type || 'none',
                asJson(data.auth, {}),
                data.pre_request_script || '',
                data.test_script || '',
            ]);
        }
        const id = (0, db_1.lastId)();
        const row = (id ? (0, db_1.get)('SELECT * FROM requests WHERE id = ?', [id]) : null) ||
            (0, db_1.get)('SELECT * FROM requests WHERE collection_id = ? ORDER BY id DESC LIMIT 1', [data.collection_id]);
        if (!row)
            return res.status(500).json({ error: 'Insert failed' });
        res.json(row);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Insert failed' });
    }
});
router.put('/:id', (req, res) => {
    const existing = (0, db_1.get)('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    if (!existing)
        return res.status(404).json({ detail: 'Request not found' });
    const data = { ...existing, ...req.body };
    if (req.body.headers && typeof req.body.headers !== 'string')
        data.headers = req.body.headers;
    if (req.body.params && typeof req.body.params !== 'string')
        data.params = req.body.params;
    if (req.body.auth && typeof req.body.auth !== 'string')
        data.auth = req.body.auth;
    if (req.body.captures && typeof req.body.captures !== 'string')
        data.captures = req.body.captures;
    (0, db_1.run)(`
    UPDATE requests SET
      collection_id = ?, name = ?, method = ?, url = ?,
      headers = ?, params = ?, body_type = ?, body_content = ?, body_raw_type = ?,
      auth_type = ?, auth = ?, pre_request_script = ?, test_script = ?,
      grpc_service = ?, grpc_method = ?, grpc_proto = ?, grpc_message = ?, folder = ?, captures = ?
    WHERE id = ?
  `, [...requestValues(data), req.params.id]);
    const row = (0, db_1.get)('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    res.json(row);
});
router.delete('/:id', (req, res) => {
    (0, db_1.run)('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});
exports.default = router;
//# sourceMappingURL=requests.js.map