"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    const rows = (0, db_1.all)('SELECT * FROM history ORDER BY executed_at DESC LIMIT 200');
    res.json(rows);
});
router.delete('/:id', (req, res) => {
    (0, db_1.run)('DELETE FROM history WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});
router.delete('/', (_req, res) => {
    (0, db_1.run)('DELETE FROM history');
    res.json({ ok: true });
});
exports.default = router;
//# sourceMappingURL=history.js.map