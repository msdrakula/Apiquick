import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CookieJar } from 'tough-cookie';
import { performance } from 'perf_hooks';
import crypto from 'crypto';
import vm from 'vm';
import { URL } from 'url';
import { replaceVariables, getPredefinedVariables, CounterCtx, makeExecuteCounters } from './variables';
import { isHostAllowed } from './settings';

export interface TimelineEntry {
  name: string;
  start: number;
  end: number;
}

export interface ExecuteOptions {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string; enabled?: boolean }>;
  params: Array<{ key: string; value: string; enabled?: boolean }>;
  bodyType: string;
  bodyContent?: string;
  bodyRawType?: string;
  authType: string;
  auth: Record<string, any>;
  variables: Record<string, string>;
  preRequestScript?: string;
  testScript?: string;
  cookies: Array<{ domain: string; name: string; value: string; path?: string }>;
  incrementCounters?: boolean;
}

export interface ExecuteResult {
  status: number;
  statusText: string;
  headers: Array<{ key: string; value: string; enabled?: boolean }>;
  body: string;
  timeMs: number;
  timeline: TimelineEntry[];
  cookies: Array<{ domain: string; name: string; value: string; path: string }>;
  testResults?: Array<{ name: string; passed: boolean; error?: string }>;
  logs?: string[];
}

function createAxiosInstance(jar?: CookieJar) {
  const instance = axios.create({
    timeout: 30000,
    maxRedirects: 10,
    validateStatus: () => true,
    responseType: 'arraybuffer',
    proxy: false,
  });

  instance.interceptors.request.use(async (config) => {
    (config as any).__startTime = performance.now();
    if (jar && config.url) {
      try {
        const cookie = await jar.getCookieString(config.url);
        if (cookie) {
          const headers = (config.headers || {}) as Record<string, string>;
          if (!headers.Cookie && !headers.cookie) headers.Cookie = cookie;
          config.headers = headers as any;
        }
      } catch { /* ignore */ }
    }
    return config;
  });

  instance.interceptors.response.use(async (response) => {
    const start = (response.config as any).__startTime;
    if (start) (response as any).__responseTime = performance.now() - start;
    if (jar && response.config.url) {
      const raw = response.headers['set-cookie'];
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      for (const c of list) {
        try { await jar.setCookie(c, response.config.url); } catch { /* ignore */ }
      }
    }
    return response;
  });

  return instance;
}

export function applyAuth(
  headers: Record<string, string>,
  url: URL,
  authType: string,
  auth: Record<string, any>
) {
  if (authType === 'basic') {
    const { username = '', password = '' } = auth;
    headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  } else if (authType === 'bearer') {
    headers['Authorization'] = `Bearer ${auth.token || ''}`;
  } else if (authType === 'apikey') {
    const { key = '', value = '', addTo = 'header' } = auth;
    if (!key) return;
    if (addTo === 'header') headers[key] = value;
    else url.searchParams.set(key, value);
  } else if (authType === 'oauth2') {
    headers['Authorization'] = `Bearer ${auth.accessToken || ''}`;
  }
}

export function runPmScript(script: string | undefined, context: any): { logs: string[]; error?: string } {
  const logs: string[] = [];
  if (!script || !script.trim()) return { logs };

  const sandbox = {
    pm: {
      variables: {
        get: (k: string) => context.vars[k],
        set: (k: string, v: string) => { context.vars[k] = String(v); },
      },
      environment: {
        get: (k: string) => context.vars[k],
        set: (k: string, v: string) => { context.vars[k] = String(v); },
      },
      request: context.request,
      response: context.response,
      test: (name: string, fn: () => void) => {
        try { fn(); context.tests.push({ name, passed: true }); }
        catch (e: any) { context.tests.push({ name, passed: false, error: e.message }); }
      },
      expect: (val: any) => ({
        to: {
          equal: (expected: any) => {
            if (val !== expected) throw new Error(`Expected ${expected}, got ${val}`);
          },
          be: {
            true: () => { if (val !== true) throw new Error(`Expected true, got ${val}`); },
            false: () => { if (val !== false) throw new Error(`Expected false, got ${val}`); },
          },
          have: {
            status: (code: number) => {
              if (context.response.status !== code) throw new Error(`Expected status ${code}, got ${context.response.status}`);
            },
          },
        },
      }),
      log: (...args: any[]) => logs.push(args.map(String).join(' ')),
    },
    console: { log: (...args: any[]) => logs.push(args.map(String).join(' ')) },
    setTimeout: () => { throw new Error('setTimeout is not allowed in sandbox'); },
    setInterval: () => { throw new Error('setInterval is not allowed in sandbox'); },
    require: () => { throw new Error('require is not allowed in sandbox'); },
  };

  try {
    vm.createContext(sandbox);
    vm.runInContext(script, sandbox, { timeout: 5000, displayErrors: true });
  } catch (e: any) {
    return { logs, error: e.message };
  }
  return { logs };
}

function buildDigestAuth(
  method: string,
  pathname: string,
  auth: Record<string, any>,
  wwwAuth: string
): string {
  const username = auth.username || '';
  const password = auth.password || '';
  const realm = wwwAuth.match(/realm="([^"]+)"/)?.[1] || auth.realm || '';
  const nonce = wwwAuth.match(/nonce="([^"]+)"/)?.[1] || '';
  const opaque = wwwAuth.match(/opaque="([^"]+)"/)?.[1] || '';
  const qop = wwwAuth.match(/qop="([^"]+)"/)?.[1] || 'auth';
  const nc = '00000001';
  const cnonce = crypto.randomBytes(8).toString('hex');
  const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
  const ha2 = crypto.createHash('md5').update(`${method.toUpperCase()}:${pathname}`).digest('hex');
  const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
  return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${pathname}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"${opaque ? `, opaque="${opaque}"` : ''}`;
}

export function encodeFormBody(bodyContent: string, vars: Record<string, string>, counters?: CounterCtx): string {
  try {
    const items = JSON.parse(bodyContent);
    if (Array.isArray(items)) {
      const params = new URLSearchParams();
      for (const item of items) {
        if (item.enabled === false || !item.key) continue;
        params.append(
          replaceVariables(String(item.key), vars, counters),
          replaceVariables(String(item.value ?? ''), vars, counters)
        );
      }
      return params.toString();
    }
  } catch { /* raw string */ }
  return replaceVariables(bodyContent, vars, counters);
}

export function encodeMultipartBody(bodyContent: string, vars: Record<string, string>, counters?: CounterCtx): { contentType: string; body: string } {
  const boundary = '----apiquick-boundary';
  const parts: string[] = [];
  try {
    const items = JSON.parse(bodyContent);
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.enabled === false || !item.key) continue;
        const key = replaceVariables(String(item.key), vars, counters);
        const value = replaceVariables(String(item.value ?? ''), vars, counters);
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
      }
    }
  } catch {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${replaceVariables(bodyContent, vars, counters)}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: parts.join(''),
  };
}

export async function executeRequest(opts: ExecuteOptions): Promise<ExecuteResult> {
  const timeline: TimelineEntry[] = [];
  const t0 = performance.now();
  const logs: string[] = [];

  const allVariables = { ...getPredefinedVariables(), ...opts.variables };
  const counters = makeExecuteCounters(opts.incrementCounters !== false);
  let urlStr = replaceVariables(opts.url, allVariables, counters);
  const urlObj = new URL(urlStr);
  if (!isHostAllowed(urlObj.hostname)) {
    throw new Error(`Blocked: ${urlObj.hostname} is not in the host allowlist`);
  }
  for (const p of opts.params) {
    if (p.enabled !== false) {
      urlObj.searchParams.set(replaceVariables(p.key, allVariables, counters), replaceVariables(p.value, allVariables, counters));
    }
  }
  urlStr = urlObj.toString();

  const headers: Record<string, string> = {};
  for (const h of opts.headers) {
    if (h.enabled !== false) {
      headers[replaceVariables(h.key, allVariables, counters)] = replaceVariables(h.value, allVariables, counters);
    }
  }

  const jar = new CookieJar();
  for (const c of opts.cookies) {
    try {
      const host = c.domain || 'localhost';
      const url = host.includes('://') ? host : `http://${host}/`;
      jar.setCookieSync(`${c.name}=${c.value}; Path=${c.path || '/'}`, url);
    } catch { /* ignore invalid cookies */ }
  }

  applyAuth(headers, urlObj, opts.authType, opts.auth);
  urlStr = urlObj.toString();

  let data: any;
  const contentType = headers['Content-Type'] || headers['content-type'];
  if (opts.bodyType === 'raw' && opts.bodyContent) {
    data = replaceVariables(opts.bodyContent, allVariables, counters);
    if (!contentType) {
      if (opts.bodyRawType === 'json') headers['Content-Type'] = 'application/json';
      else if (opts.bodyRawType === 'xml') headers['Content-Type'] = 'application/xml';
      else if (opts.bodyRawType === 'html') headers['Content-Type'] = 'text/html';
      else headers['Content-Type'] = 'text/plain';
    }
  } else if (opts.bodyType === 'x_form' && opts.bodyContent) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    data = encodeFormBody(opts.bodyContent, allVariables, counters);
  } else if (opts.bodyType === 'form_data' && opts.bodyContent) {
    const encoded = encodeMultipartBody(opts.bodyContent, allVariables, counters);
    headers['Content-Type'] = encoded.contentType;
    data = encoded.body;
  }

  const tPrepared = performance.now();
  timeline.push({ name: 'Prepare', start: 0, end: tPrepared - t0 });

  const scriptContext = {
    vars: { ...allVariables },
    request: { url: urlStr, method: opts.method, headers, body: data },
    tests: [] as any[],
  };
  if (opts.preRequestScript) {
    const res = runPmScript(opts.preRequestScript, scriptContext);
    logs.push(...res.logs);
    Object.assign(allVariables, scriptContext.vars);
    urlStr = scriptContext.request.url;
    Object.assign(headers, scriptContext.request.headers);
    if (scriptContext.request.body) data = scriptContext.request.body;
  }

  const instance = createAxiosInstance(jar);
  const config: AxiosRequestConfig = {
    method: opts.method.toUpperCase() as any,
    url: urlStr,
    headers,
    data,
    maxRedirects: 10,
  };

  let axiosRes: AxiosResponse;
  try {
    axiosRes = await instance.request(config);
  } catch (err: any) {
    throw new Error(err.message || 'Request failed');
  }

  if (axiosRes.status === 401 && opts.authType === 'digest') {
    const wwwAuth = axiosRes.headers['www-authenticate'];
    if (typeof wwwAuth === 'string' && wwwAuth.toLowerCase().startsWith('digest')) {
      const parsed = new URL(urlStr);
      const digestHeader = buildDigestAuth(opts.method, parsed.pathname, opts.auth, wwwAuth);
      headers['Authorization'] = digestHeader;
      axiosRes = await instance.request({ ...config, headers });
    }
  }

  const transferMs = (axiosRes as any).__responseTime || (performance.now() - tPrepared);
  timeline.push({ name: 'Transfer', start: timeline[timeline.length - 1].end, end: timeline[timeline.length - 1].end + transferMs });

  const bodyBuf = Buffer.from(axiosRes.data);
  const body = bodyBuf.toString('utf-8');
  const tDone = performance.now();
  timeline.push({ name: 'Total', start: 0, end: tDone - t0 });

  const responseHeaders: Array<{ key: string; value: string; enabled?: boolean }> = [];
  for (const [key, val] of Object.entries(axiosRes.headers)) {
    if (!val) continue;
    const value = Array.isArray(val) ? val.join(', ') : String(val);
    responseHeaders.push({ key, value, enabled: true });
  }

  const newCookies: Array<{ domain: string; name: string; value: string; path: string }> = [];
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
  } catch { /* ignore */ }

  const testContext = {
    vars: { ...allVariables },
    request: { url: opts.url, method: opts.method, headers: opts.headers, body: opts.bodyContent },
    response: { status: axiosRes.status, body, headers: responseHeaders },
    tests: [] as any[],
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
    timeMs: Math.round((axiosRes as any).__responseTime || (tDone - t0)),
    timeline,
    cookies: newCookies,
    testResults: testContext.tests,
    logs,
  };
}
