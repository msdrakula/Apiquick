import { describe, it, expect, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { executeRequest } from '../utils/executor';

function listen(handler: http.RequestListener): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function origin(server: http.Server) {
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

describe('executeRequest', () => {
  const servers: http.Server[] = [];
  afterAll(() => servers.forEach(s => s.close()));

  it('sends GET with headers, params and variables', async () => {
    const server = await listen((req, res) => {
      const url = new URL(req.url || '', 'http://x');
      res.setHeader('x-echo', req.headers['x-token'] || '');
      res.end(JSON.stringify({ q: url.searchParams.get('q'), path: url.pathname }));
    });
    servers.push(server);

    const result = await executeRequest({
      method: 'GET',
      url: origin(server) + '/{{path}}',
      headers: [{ key: 'X-Token', value: '{{tok}}', enabled: true }],
      params: [{ key: 'q', value: 'hi', enabled: true }],
      bodyType: 'none',
      authType: 'none',
      auth: {},
      variables: { path: 'echo', tok: 'secret' },
      cookies: [],
    });

    expect(result.status).toBe(200);
    expect(result.headers.find(h => h.key.toLowerCase() === 'x-echo')?.value).toBe('secret');
    expect(JSON.parse(result.body).q).toBe('hi');
    expect(JSON.parse(result.body).path).toBe('/echo');
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
    expect(result.timeline.some(t => t.name === 'Transfer')).toBe(true);
  });

  it('posts raw JSON and runs tests', async () => {
    const server = await listen((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        res.statusCode = 201;
        res.end(Buffer.concat(chunks));
      });
    });
    servers.push(server);

    const result = await executeRequest({
      method: 'POST',
      url: origin(server) + '/',
      headers: [],
      params: [],
      bodyType: 'raw',
      bodyContent: '{"n":1}',
      bodyRawType: 'json',
      authType: 'none',
      auth: {},
      variables: {},
      cookies: [],
      testScript: `pm.test('created', () => { pm.expect(pm.response.status).to.have.status(201); });`,
    });

    expect(result.status).toBe(201);
    expect(result.body).toBe('{"n":1}');
    expect(result.testResults?.[0].passed).toBe(true);
  });

  it('stores and sends cookies', async () => {
    let sawCookie = '';
    const server = await listen((req, res) => {
      if (req.url === '/set') {
        res.setHeader('Set-Cookie', 'sid=abc; Path=/');
        res.end('ok');
        return;
      }
      sawCookie = String(req.headers.cookie || '');
      res.end('next');
    });
    servers.push(server);
    const base = origin(server);

    const first = await executeRequest({
      method: 'GET', url: base + '/set', headers: [], params: [],
      bodyType: 'none', authType: 'none', auth: {}, variables: {}, cookies: [],
    });
    expect(first.cookies.some(c => c.name === 'sid' && c.value === 'abc')).toBe(true);

    await executeRequest({
      method: 'GET', url: base + '/read', headers: [], params: [],
      bodyType: 'none', authType: 'none', auth: {}, variables: {},
      cookies: first.cookies,
    });
    expect(sawCookie).toContain('sid=abc');
  });

  it('sends basic auth', async () => {
    let auth = '';
    const server = await listen((req, res) => {
      auth = String(req.headers.authorization || '');
      res.end('ok');
    });
    servers.push(server);
    await executeRequest({
      method: 'GET', url: origin(server) + '/', headers: [], params: [],
      bodyType: 'none', authType: 'basic', auth: { username: 'a', password: 'b' },
      variables: {}, cookies: [],
    });
    expect(auth).toBe('Basic ' + Buffer.from('a:b').toString('base64'));
  });

  it('pre-request script can change url variable', async () => {
    const server = await listen((_req, res) => res.end('ok'));
    servers.push(server);
    const result = await executeRequest({
      method: 'GET',
      url: origin(server) + '/',
      headers: [],
      params: [],
      bodyType: 'none',
      authType: 'none',
      auth: {},
      variables: {},
      cookies: [],
      preRequestScript: `pm.variables.set('x', '1');`,
    });
    expect(result.status).toBe(200);
  });
});
