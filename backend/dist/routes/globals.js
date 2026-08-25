"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const secrets_1 = require("../utils/secrets");
const router = (0, express_1.Router)();
function parseGlobal(row) {
    if (!row)
        return row;
    return { ...row, value: (0, secrets_1.unprotectSecret)(row.value) };
}
router.get('/', (_req, res) => {
    res.json((0, db_1.all)('SELECT * FROM globals ORDER BY key').map(parseGlobal));
});
router.post('/', (req, res) => {
    const { key, value, secret } = req.body;
    if (!key)
        return res.status(400).json({ error: 'Key is required' });
    const stored = secret ? (0, secrets_1.protectSecret)(value || '') : (value || '');
    (0, db_1.run)('INSERT INTO globals (key, value, secret) VALUES (?, ?, ?)', [key, stored, secret ? 1 : 0]);
    const row = (0, db_1.get)('SELECT * FROM globals WHERE key = ?', [key]);
    res.json(parseGlobal(row));
});
router.put('/:id', (req, res) => {
    const { key, value, secret } = req.body;
    const stored = secret ? (0, secrets_1.protectSecret)(value || '') : (value || '');
    (0, db_1.run)('UPDATE globals SET key = ?, value = ?, secret = ? WHERE id = ?', [key, stored, secret ? 1 : 0, req.params.id]);
    const row = (0, db_1.get)('SELECT * FROM globals WHERE id = ?', [req.params.id]);
    res.json(parseGlobal(row));
});
router.delete('/:id', (req, res) => {
    (0, db_1.run)('DELETE FROM globals WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});
exports.default = router;
//# sourceMappingURL=globals.js.map