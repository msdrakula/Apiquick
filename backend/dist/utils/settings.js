"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getAllowlist = getAllowlist;
exports.isHostAllowed = isHostAllowed;
const db_1 = require("../db");
function getSetting(key, fallback = '') {
    try {
        const row = (0, db_1.get)('SELECT value FROM settings WHERE key = ?', [key]);
        return row && row.value != null ? String(row.value) : fallback;
    }
    catch {
        return fallback;
    }
}
function setSetting(key, value) {
    const existing = (0, db_1.get)('SELECT key FROM settings WHERE key = ?', [key]);
    if (existing)
        (0, db_1.run)('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
    else
        (0, db_1.run)('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
}
function getAllowlist() {
    const enabled = getSetting('allowlist_enabled', '0') === '1';
    const hosts = getSetting('allowlist_hosts', '127.0.0.1,localhost')
        .split(/[,;\s]+/)
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
    return { enabled, hosts };
}
function isHostAllowed(hostname) {
    try {
        const { enabled, hosts } = getAllowlist();
        if (!enabled)
            return true;
        const host = (hostname || '').toLowerCase();
        return hosts.some((pattern) => {
            if (pattern.startsWith('*.')) {
                const suffix = pattern.slice(1);
                return host.endsWith(suffix) || host === pattern.slice(2);
            }
            return host === pattern;
        });
    }
    catch {
        return true;
    }
}
//# sourceMappingURL=settings.js.map