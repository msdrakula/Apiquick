"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_1 = require("../utils/settings");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    const allow = (0, settings_1.getAllowlist)();
    res.json({
        allowlistEnabled: allow.enabled,
        allowlistHosts: (0, settings_1.getSetting)('allowlist_hosts', '127.0.0.1,localhost'),
    });
});
router.put('/', (req, res) => {
    if (req.body.allowlistEnabled != null) {
        (0, settings_1.setSetting)('allowlist_enabled', req.body.allowlistEnabled ? '1' : '0');
    }
    if (typeof req.body.allowlistHosts === 'string') {
        (0, settings_1.setSetting)('allowlist_hosts', req.body.allowlistHosts);
    }
    const allow = (0, settings_1.getAllowlist)();
    res.json({
        allowlistEnabled: allow.enabled,
        allowlistHosts: (0, settings_1.getSetting)('allowlist_hosts', '127.0.0.1,localhost'),
    });
});
exports.default = router;
//# sourceMappingURL=settings.js.map