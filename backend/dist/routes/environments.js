"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const secrets_1 = require("../utils/secrets");
const router = (0, express_1.Router)();
function parseEnv(row) {
    if (!row)
        return row;
    try {
        row.variables = (0, secrets_1.decryptVarList)(JSON.parse(row.variables || '[]'));
    }
    catch {
        try {
            row.variables = JSON.parse(row.variables || '[]');
        }
        catch {
            row.variables = [];
        }
    }
    return row;
}
router.get('/', (_req, res) => {
    const rows = (0, db_1.all)('SELECT * FROM environments ORDER BY updated_at DESC').map(parseEnv);
    res.json(rows);
});
router.post('/', (req, res) => {
    const { name, variables } = req.body;
    (0, db_1.run)('INSERT INTO environments (name, variables) VALUES (?, ?)', [name, JSON.stringify((0, secrets_1.encryptVarList)(variables || []))]);
    const row = (0, db_1.get)('SELECT * FROM environments WHERE id = ?', [(0, db_1.lastId)('environments')]);
    res.json(parseEnv(row));
});
router.put('/:id', (req, res) => {
    const { name, variables } = req.body;
    (0, db_1.run)('UPDATE environments SET name = ?, variables = ? WHERE id = ?', [name, JSON.stringify((0, secrets_1.encryptVarList)(variables || [])), req.params.id]);
    const row = (0, db_1.get)('SELECT * FROM environments WHERE id = ?', [req.params.id]);
    res.json(parseEnv(row));
});
router.delete('/:id', (req, res) => {
    (0, db_1.run)('DELETE FROM environments WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});
exports.default = router;
//# sourceMappingURL=environments.js.map