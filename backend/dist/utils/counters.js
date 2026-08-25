"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.peekCounter = peekCounter;
exports.bumpCounter = bumpCounter;
exports.makeCounterCtx = makeCounterCtx;
const db_1 = require("../db");
const mem = {};
function peekCounter(name) {
    try {
        const row = (0, db_1.get)('SELECT value FROM counters WHERE name = ?', [name]);
        return row ? Number(row.value) || 0 : 0;
    }
    catch {
        return mem[name] || 0;
    }
}
function bumpCounter(name) {
    const current = peekCounter(name);
    const next = current + 1;
    try {
        const existing = (0, db_1.get)('SELECT name FROM counters WHERE name = ?', [name]);
        if (existing)
            (0, db_1.run)('UPDATE counters SET value = ? WHERE name = ?', [next, name]);
        else
            (0, db_1.run)('INSERT INTO counters (name, value) VALUES (?, ?)', [name, next]);
    }
    catch {
        mem[name] = next;
    }
    return next;
}
function makeCounterCtx(increment) {
    const cache = {};
    return {
        value(name) {
            const key = name || 'default';
            if (cache[key] != null)
                return cache[key];
            const n = increment ? bumpCounter(key) : peekCounter(key) + 1;
            cache[key] = String(n);
            return cache[key];
        },
    };
}
//# sourceMappingURL=counters.js.map