"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAuth = applyAuth;
exports.runPmScript = runPmScript;
exports.encodeFormBody = encodeFormBody;
exports.encodeMultipartBody = encodeMultipartBody;
exports.executeRequest = executeRequest;
const axios_1 = __importDefault(require("axios"));
const tough_cookie_1 = require("tough-cookie");
const perf_hooks_1 = require("perf_hooks");
const crypto_1 = __importDefault(require("crypto"));
const vm_1 = __importDefault(require("vm"));
const url_1 = require("url");
const variables_1 = require("./variables");
const settings_1 = require("./settings");
function createAxiosInstance(jar) {
    const instance = axios_1.default.create({
        timeout: 30000,
        maxRedirects: 10,
        validateStatus: () => true,
        responseType: 'arraybuffer',
        proxy: false,
    });
    instance.interceptors.request.use(async (config) => {
        config.__startTime = perf_hooks_1.performance.now();
        if (jar && config.url) {
            try {
                const cookie = await jar.getCookieString(config.url);
                if (cookie) {
                    const headers = (config.headers || {});
                    if (!headers.Cookie && !headers.cookie)
                        headers.Cookie = cookie;
                    config.headers = headers;
                }
            }
            catch { /* ignore */ }
        }
        return config;
    });
    instance.interceptors.response.use(async (response) => {
        const start = response.config.__startTime;
        if (start)
            response.__responseTime = perf_hooks_1.performance.now() - start;
        if (jar && response.config.url) {
            const raw = response.headers['set-cookie'];
            const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
            for (const c of list) {
                try {
                    await jar.setCookie(c, response.config.url);
                }
                catch { /* ignore */ }
            }
        }
        return response;
    });
    return instance;
}
function applyAuth(headers, url, authType, auth) {
    if (authType === 'basic') {
        const { username = '', password = '' } = auth;
        headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }
    else if (authType === 'bearer') {
        headers['Authorization'] = `Bearer ${auth.token || ''}`;
    }
    else if (authType === 'apikey') {
        const { key = '', value = '', addTo = 'header' } = auth;
        if (!key)
            return;
        if (addTo === 'header')
            headers[key] = value;
        else
            url.searchParams.set(key, value);
    }
    else if (authType === 'oauth2') {
        headers['Authorization'] = `Bearer ${auth.accessToken || ''}`;
    }
}
function runPmScript(script, context) {
    const logs = [];
    if (!script || !script.trim())
        return { logs };
    const sandbox = {
        pm: {
            variables: {
                get: (k) => context.vars[k],
                set: (k, v) => { context.vars[k] = String(v); },
            },
            environment: {
                get: (k) => context.vars[k],
                set: (k, v) => { context.vars[k] = String(v); },
            },
            request: context.request,
            response: context.response,
            test: (name, fn) => {
                try {
                    fn();
                    context.tests.push({ name, passed: true });
                }
                catch (e) {
                    context.tests.push({ name, passed: false, error: e.message });
                }
            },
            expect: (val) => ({
                to: {
                    equal: (expected) => {
                        if (val !== expected)
                            throw new Error(`Expected ${expected}, got ${val}`);
                    },
                    be: {
                        true: () => { if (val !== true)
                            throw new Error(`Expected true, got ${val}`); },
                        false: () => { if (val !== false)
                            throw new Error(`Expected false, got ${val}`); },
                    },
                    have: {
                        status: (code) => {
                            if (context.response.status !== code)
                                throw new Error(`Expected status ${code}, got ${context.response.status}`);
                        },
                    },
                },
            }),
            log: (...args) => logs.push(args.map(String).join(' ')),
        },
        console: { log: (...args) => logs.push(args.map(String).join(' ')) },
        setTimeout: () => { throw new Error('setTimeout is not allowed in sandbox'); },
        setInterval: () => { throw new Error('setInterval is not allowed in sandbox'); },
        require: () => { throw new Error('require is not allowed in sandbox'); },
    };
    try {
        vm_1.default.createContext(sandbox);
        vm_1.default.runInContext(script, sandbox, { timeout: 5000, displayErrors: true });
    }
    catch (e) {
        return { logs, error: e.message };
    }
    return { logs };
}
function buildDigestAuth(method, pathname, auth, wwwAuth) {
    const username = auth.username || '';
    const password = auth.password || '';
    const realm = wwwAuth.match(/realm="([^"]+)"/)?.[1] || auth.realm || '';
    const nonce = wwwAuth.match(/nonce="([^"]+)"/)?.[1] || '';
    const opaque = wwwAuth.match(/opaque="([^"]+)"/)?.[1] || '';
    const qop = wwwAuth.match(/qop="([^"]+)"/)?.[1] || 'auth';
    const nc = '00000001';
    const cnonce = crypto_1.default.randomBytes(8).toString('hex');
    const ha1 = crypto_1.default.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
    const ha2 = crypto_1.default.createHash('md5').update(`${method.toUpperCase()}:${pathname}`).digest('hex');
    const response = crypto_1.default.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
    return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${pathname}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"${opaque ? `, opaque="${opaque}"` : ''}`;
}
function encodeFormBody(bodyContent, vars, counters) {
    try {
        const items = JSON.parse(bodyContent);
        if (Array.isArray(items)) {
            const params = new URLSearchParams();
            for (const item of items) {
                if (item.enabled === false || !item.key)
                    continue;
                params.append((0, variables_1.replaceVariables)(String(item.key), vars, counters), (0, variables_1.replaceVariables)(String(item.value ?? ''), vars, counters));
            }
            return params.toString();
        }
    }
    catch { /* raw string */ }
    return (0, variables_1.replaceVariables)(bodyContent, vars, counters);
}
function encodeMultipartBody(bodyContent, vars, counters) {
    const boundary = '----apiquick-boundary';
    const parts = [];
    try {
        const items = JSON.parse(bodyContent);
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item.enabled === false || !item.key)
                    continue;
                const key = (0, variables_1.replaceVariables)(String(item.key), vars, counters);
                const value = (0, variables_1.replaceVariables)(String(item.value ?? ''), vars, counters);
                parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
            }
        }
    }
    catch {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${(0, variables_1.replaceVariables)(bodyContent, vars, counters)}\r\n`);
    }
    parts.push(`--${boundary}--\r\n`);
    return {
        contentType: `multipart/form-data; boundary=${boundary}`,
        body: parts.join(''),
    };
}
async function executeRequest(opts) {
    const timeline = [];
    const t0 = perf_hooks_1.performance.now();
    const logs = [];
    const allVariables = { ...(0, variables_1.getPredefinedVariables)(), ...opts.variables };
    const counters = (0, variables_1.makeExecuteCounters)(opts.incrementCounters !== false);
    let urlStr = (0, variables_1.replaceVariables)(opts.url, allVariables, counters);
    const urlObj = new url_1.URL(urlStr);
    if (!(0, settings_1.isHostAllowed)(urlObj.hostname)) {
        throw new Error(`Blocked: ${urlObj.hostname} is not in the host allowlist`);
    }
    for (const p of opts.params) {
        if (p.enabled !== false) {
            urlObj.searchParams.set((0, variables_1.replaceVariables)(p.key, allVariables, counters), (0, variables_1.replaceVariables)(p.value, allVariables, counters));
        }
    }
    urlStr = urlObj.toString();
    const headers = {};
    for (const h of opts.headers) {
        if (h.enabled !== false) {
            headers[(0, variables_1.replaceVariables)(h.key, allVariables, counters)] = (0, variables_1.replaceVariables)(h.value, allVariables, counters);
        }
    }
    const jar = new tough_cookie_1.CookieJar();
    for (const c of opts.cookies) {
        try {
            const host = c.domain || 'localhost';
            const url = host.includes('://') ? host : `http://${host}/`;
            jar.setCookieSync(`${c.name}=${c.value}; Path=${c.path || '/'}`, url);
        }
        catch { /* ignore invalid cookies */ }
    }
    applyAuth(headers, urlObj, opts.authType, opts.auth);
    urlStr = urlObj.toString();
    let data;
    const contentType = headers['Content-Type'] || headers['content-type'];
    if (opts.bodyType === 'raw' && opts.bodyContent) {
        data = (0, variables_1.replaceVariables)(opts.bodyContent, allVariables, counters);
        if (!contentType) {
            if (opts.bodyRawType === 'json')
                headers['Content-Type'] = 'application/json';
            else if (opts.bodyRawType === 'xml')
                headers['Content-Type'] = 'application/xml';
            else if (opts.bodyRawType === 'html')
                headers['Content-Type'] = 'text/html';
            else
                headers['Content-Type'] = 'text/plain';
        }
    }
    else if (opts.bodyType === 'x_form' && opts.bodyContent) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        data = encodeFormBody(opts.bodyContent, allVariables, counters);
    }
    else if (opts.bodyType === 'form_data' && opts.bodyContent) {
        const encoded = encodeMultipartBody(opts.bodyContent, allVariables, counters);
        headers['Content-Type'] = encoded.contentType;
        data = encoded.body;
    }
    const tPrepared = perf_hooks_1.performance.now();
    timeline.push({ name: 'Prepare', start: 0, end: tPrepared - t0 });
    const scriptContext = {
        vars: { ...allVariables },
        request: { url: urlStr, method: opts.method, headers, body: data },
        tests: [],
    };
    if (opts.preRequestScript) {
        const res = runPmScript(opts.preRequestScript, scriptContext);
        logs.push(...res.logs);
        Object.assign(allVariables, scriptContext.vars);
        urlStr = scriptContext.request.url;
        Object.assign(headers, scriptContext.request.headers);
        if (scriptContext.request.body)
            data = scriptContext.request.body;
    }
    const instance = createAxiosInstance(jar);
    const config = {
        method: opts.method.toUpperCase(),
        url: urlStr,
        headers,
        data,
        maxRedirects: 10,
    };
    let axiosRes;
    try {
        axiosRes = await instance.request(config);
    }
    catch (err) {
        throw new Error(err.message || 'Request failed');
    }
    if (axiosRes.status === 401 && opts.authType === 'digest') {
        const wwwAuth = axiosRes.headers['www-authenticate'];
        if (typeof wwwAuth === 'string' && wwwAuth.toLowerCase().startsWith('digest')) {
            const parsed = new url_1.URL(urlStr);
            const digestHeader = buildDigestAuth(opts.method, parsed.pathname, opts.auth, wwwAuth);
            headers['Authorization'] = digestHeader;
            axiosRes = await instance.request({ ...config, headers });
        }
    }
    const transferMs = axiosRes.__responseTime || (perf_hooks_1.performance.now() - tPrepared);
    timeline.push({ name: 'Transfer', start: timeline[timeline.length - 1].end, end: timeline[timeline.length - 1].end + transferMs });
    const bodyBuf = Buffer.from(axiosRes.data);
    const body = bodyBuf.toString('utf-8');
    const tDone = perf_hooks_1.performance.now();
    timeline.push({ name: 'Total', start: 0, end: tDone - t0 });
    const responseHeaders = [];
    for (const [key, val] of Object.entries(axiosRes.headers)) {
        if (!val)
            continue;
        const value = Array.isArray(val) ? val.join(', ') : String(val);
        responseHeaders.push({ key, value, enabled: true });
    }
    const newCookies = [];
    try {
        const cookies = await jar.getCookies(urlStr);
        for (const c of cookies) {
            newCookies.push({
                domain: c.domain || urlObj.hostname,
                name: c.key,
                value: c.value,
                path: c.path || '/',
            });
        }
    }
    catch { /* ignore */ }
    const testContext = {
        vars: { ...allVariables },
        request: { url: opts.url, method: opts.method, headers: opts.headers, body: opts.bodyContent },
        response: { status: axiosRes.status, body, headers: responseHeaders },
        tests: [],
    };
    if (opts.testScript) {
        const res = runPmScript(opts.testScript, testContext);
        logs.push(...res.logs);
    }
    return {
        status: axiosRes.status,
        statusText: axiosRes.statusText || '',
        headers: responseHeaders,
        body,
        timeMs: Math.round(axiosRes.__responseTime || (tDone - t0)),
        timeline,
        cookies: newCookies,
        testResults: testContext.tests,
        logs,
    };
}
//# sourceMappingURL=executor.js.map