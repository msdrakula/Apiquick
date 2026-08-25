"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFromPayload = executeFromPayload;
const express_1 = require("express");
const db_1 = require("../db");
const executor_1 = require("../utils/executor");
const variables_1 = require("../utils/variables");
const secrets_1 = require("../utils/secrets");
const router = (0, express_1.Router)();
const MAX_HISTORY_BODY = 512 * 1024;
function parseJson(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value !== 'string')
        return value;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
function collectCookies() {
    return (0, db_1.all)('SELECT * FROM cookies').map((c) => ({
        domain: c.domain,
        name: c.name,
        value: c.value,
        path: c.path,
    }));
}
function persistCookies(cookies) {
    for (const c of cookies) {
        const existing = (0, db_1.get)('SELECT id FROM cookies WHERE domain = ? AND name = ?', [c.domain, c.name]);
        if (existing) {
            (0, db_1.run)('UPDATE cookies SET value = ?, path = ? WHERE id = ?', [c.value, c.path, existing.id]);
        }
        else {
            (0, db_1.run)('INSERT INTO cookies (domain, name, value, path) VALUES (?, ?, ?, ?)', [c.domain, c.name, c.value, c.path]);
        }
    }
}
function getByPath(obj, path) {
    const parts = String(path || '').replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let cur = obj;
    for (const p of parts) {
        if (cur == null)
            return undefined;
        cur = cur[p];
    }
    return cur;
}
function upsertVarList(raw, key, value) {
    const list = (0, secrets_1.decryptVarList)(parseJson(raw, []));
    const idx = list.findIndex((v) => v.key === key);
    if (idx >= 0)
        list[idx] = { ...list[idx], value };
    else
        list.push({ key, value, enabled: true, secret: false });
    return JSON.stringify((0, secrets_1.encryptVarList)(list));
}
function applyCaptures(data, body) {
    const captures = parseJson(data.captures, []);
    if (!Array.isArray(captures) || !captures.length)
        return;
    let json = null;
    try {
        json = JSON.parse(body);
    }
    catch {
        return;
    }
    for (const cap of captures) {
        if (!cap || !cap.key || !cap.path)
            continue;
        const found = getByPath(json, cap.path);
        if (found === undefined || found === null)
            continue;
        const value = typeof found === 'string' ? found : JSON.stringify(found);
        const target = cap.target || 'environment';
        if (target === 'globals') {
            const existing = (0, db_1.get)('SELECT id, secret FROM globals WHERE key = ?', [cap.key]);
            if (existing)
                (0, db_1.run)('UPDATE globals SET value = ? WHERE id = ?', [value, existing.id]);
            else
                (0, db_1.run)('INSERT INTO globals (key, value, secret) VALUES (?, ?, 0)', [cap.key, value]);
        }
        else if (target === 'collection' && data.collection_id) {
            const col = (0, db_1.get)('SELECT variables FROM collections WHERE id = ?', [data.collection_id]);
            if (col)
                (0, db_1.run)('UPDATE collections SET variables = ? WHERE id = ?', [upsertVarList(col.variables, cap.key, value), data.collection_id]);
        }
        else if (data.environment_id) {
            const env = (0, db_1.get)('SELECT variables FROM environments WHERE id = ?', [data.environment_id]);
            if (env)
                (0, db_1.run)('UPDATE environments SET variables = ? WHERE id = ?', [upsertVarList(env.variables, cap.key, value), data.environment_id]);
        }
    }
}
function assembleVariables(data) {
    const variables = {};
    const globalRows = (0, db_1.all)('SELECT * FROM globals');
    for (const g of globalRows) {
        if (g.key)
            variables[g.key] = (0, secrets_1.unprotectSecret)(g.value);
    }
    if (data.collection_id) {
        const col = (0, db_1.get)('SELECT variables FROM collections WHERE id = ?', [data.collection_id]);
        if (col && col.variables) {
            const colVars = (0, secrets_1.decryptVarList)(parseJson(col.variables, []));
            if (Array.isArray(colVars)) {
                for (const v of colVars) {
                    if (v.enabled !== false && v.key)
                        variables[v.key] = v.value;
                }
            }
        }
    }
    const envs = (0, db_1.all)('SELECT * FROM environments');
    const parsedEnvs = envs.map((e) => ({ ...e, variables: (0, secrets_1.decryptVarList)(parseJson(e.variables, [])) }));
    Object.assign(variables, (0, variables_1.buildVariables)(data.environment_id, parsedEnvs));
    if (data.variables && typeof data.variables === 'object' && !Array.isArray(data.variables)) {
        Object.assign(variables, data.variables);
    }
    return variables;
}
async function executeFromPayload(data) {
    let authType = data.auth_type || 'none';
    let auth = data.auth || {};
    let preRequestScript = data.pre_request_script || '';
    let testScript = data.test_script || '';
    if (data.collection_id) {
        const col = (0, db_1.get)('SELECT auth_type, auth, pre_request_script, test_script, variables FROM collections WHERE id = ?', [data.collection_id]);
        if (col) {
            if (authType === 'none' || !auth || Object.keys(auth).length === 0) {
                if (col.auth_type && col.auth_type !== 'none') {
                    authType = col.auth_type;
                    try {
                        auth = JSON.parse(col.auth || '{}');
                    }
                    catch {
                        auth = {};
                    }
                }
            }
            if (col.pre_request_script)
                preRequestScript = `${col.pre_request_script}\n${preRequestScript}`;
            if (col.test_script)
                testScript = `${col.test_script}\n${testScript}`;
        }
    }
    const result = await (0, executor_1.executeRequest)({
        method: data.method,
        url: data.url,
        headers: data.headers || [],
        params: data.params || [],
        bodyType: data.body_type || 'none',
        bodyContent: data.body_content,
        bodyRawType: data.body_raw_type || 'json',
        authType,
        auth,
        variables: assembleVariables(data),
        preRequestScript,
        testScript,
        cookies: collectCookies(),
    });
    persistCookies(result.cookies);
    if (result.status > 0 && result.status < 400) {
        applyCaptures(data, result.body);
    }
    const bodyForHistory = result.body.length > MAX_HISTORY_BODY
        ? result.body.slice(0, MAX_HISTORY_BODY) + '\n/* truncated */'
        : result.body;
    (0, db_1.run)(`
    INSERT INTO history (request_id, name, method, url, headers, params, body_type, body_content,
      response_status, response_status_text, response_headers, response_body, response_time_ms, timeline, cookies, test_results)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        data.request_id || null,
        data.name || null,
        data.method,
        data.url,
        JSON.stringify(data.headers || []),
        JSON.stringify(data.params || []),
        data.body_type || 'none',
        data.body_content || '',
        result.status,
        result.statusText,
        JSON.stringify(result.headers),
        bodyForHistory,
        result.timeMs,
        JSON.stringify(result.timeline),
        JSON.stringify(result.cookies),
        JSON.stringify(result.testResults || []),
    ]);
    return result;
}
router.post('/preview', (req, res) => {
    try {
        const data = req.body || {};
        const variables = assembleVariables(data);
        const counters = (0, variables_1.makeExecuteCounters)(false);
        const all = { ...(0, variables_1.getPredefinedVariables)(), ...variables };
        const url = (0, variables_1.replaceVariables)(data.url || '', all, counters);
        res.json({ url });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Preview failed' });
    }
});
router.post('/', async (req, res) => {
    try {
        const result = await executeFromPayload(req.body);
        res.json(result);
    }
    catch (err) {
        res.status(502).json({ detail: err.message || 'Request failed' });
    }
});
router.post('/collection/:id', async (req, res) => {
    try {
        const colId = Number(req.params.id);
        const rows = (0, db_1.all)('SELECT * FROM requests WHERE collection_id = ? ORDER BY id', [colId]);
        const results = [];
        for (const row of rows) {
            const method = (row.method || 'GET').toUpperCase();
            if (method === 'WS' || method === 'GRPC') {
                results.push({ id: row.id, name: row.name, method, skipped: true, reason: method });
                continue;
            }
            const payload = {
                request_id: row.id,
                collection_id: colId,
                name: row.name,
                method: row.method,
                url: row.url,
                headers: parseJson(row.headers, []),
                params: parseJson(row.params, []),
                body_type: row.body_type,
                body_content: row.body_content,
                body_raw_type: row.body_raw_type,
                auth_type: row.auth_type,
                auth: parseJson(row.auth, {}),
                pre_request_script: row.pre_request_script,
                test_script: row.test_script,
                captures: parseJson(row.captures, []),
                environment_id: req.body?.environment_id,
            };
            try {
                const result = await executeFromPayload(payload);
                results.push({
                    id: row.id,
                    name: row.name,
                    method: row.method,
                    status: result.status,
                    timeMs: result.timeMs,
                    tests: result.testResults || [],
                });
            }
            catch (err) {
                results.push({ id: row.id, name: row.name, method: row.method, error: err.message });
            }
        }
        res.json({ results });
    }
    catch (err) {
        res.status(502).json({ detail: err.message || 'Collection run failed' });
    }
});
exports.default = router;
//# sourceMappingURL=execute.js.map