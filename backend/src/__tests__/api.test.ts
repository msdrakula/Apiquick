import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { initDb, closeDb } from '../db';
import { createApp } from '../app';
import { gitAvailable, runGit } from '../utils/git';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apiquick-test-'));
const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apiquick-git-repo-'));

describe('HTTP API surface', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await initDb(dir);
    app = createApp();
  });

  afterAll(() => {
    closeDb();
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.name).toBe('apiquick');
  });

  it('collections CRUD, duplicate, export, import', async () => {
    const created = await request(app).post('/collections').send({ name: 'API', description: 'd' });
    expect(created.status).toBe(200);
    expect(created.body.id).toBeGreaterThan(0);
    const id = created.body.id;

    const renamed = await request(app).put(`/collections/${id}`).send({ name: 'API v2' });
    expect(renamed.body.name).toBe('API v2');
    expect(renamed.body.description).toBe('d');

    const listed = await request(app).get('/collections');
    expect(listed.body.some((c: any) => c.id === id)).toBe(true);

    const dup = await request(app).post(`/collections/${id}/duplicate`);
    expect(dup.body.name).toContain('Copy');

    const exported = await request(app).get(`/collections/${id}/export`);
    expect(exported.body.info.name).toBe('API v2');

    const imported = await request(app).post('/collections/import').send({
      data: {
        info: { name: 'Imported' },
        item: [
          {
            name: 'Folder',
            item: [
              {
                name: 'Ping',
                request: {
                  method: 'GET',
                  url: { raw: 'https://example.com', query: [{ key: 'a', value: '1' }] },
                  header: [{ key: 'X', value: '1' }],
                },
              },
            ],
          },
        ],
      },
    });
    expect(imported.body.name).toBe('Imported');
    const reqs = await request(app).get(`/requests/collection/${imported.body.id}`);
    expect(reqs.body[0].folder).toBe('Folder');
    expect(reqs.body[0].name).toBe('Ping');
  });

  it('requests CRUD including grpc fields', async () => {
    const col = await request(app).post('/collections').send({ name: 'R' });
    const created = await request(app).post('/requests').send({
      collection_id: col.body.id,
      name: 'Get users',
      method: 'GET',
      url: 'https://example.com/users',
      headers: [{ key: 'A', value: 'B', enabled: true }],
      grpc_service: 'pkg.Svc',
      folder: 'users',
    });
    expect(created.body.id).toBeGreaterThan(0);
    expect(created.body.grpc_service).toBe('pkg.Svc');

    const updated = await request(app).put(`/requests/${created.body.id}`).send({
      name: 'Get users v2',
      grpc_method: 'List',
    });
    expect(updated.body.name).toBe('Get users v2');
    expect(updated.body.grpc_method).toBe('List');
    expect(JSON.parse(updated.body.headers)[0].key).toBe('A');

    const one = await request(app).get(`/requests/${created.body.id}`);
    expect(one.body.name).toBe('Get users v2');

    const all = await request(app).get('/requests');
    expect(all.body.some((r: any) => r.id === created.body.id)).toBe(true);

    const del = await request(app).delete(`/requests/${created.body.id}`);
    expect(del.body.ok).toBe(true);

    const extra = await request(app).post('/requests').send({
      collection_id: col.body.id,
      name: 'Temp',
    });
    expect(extra.body.id).toBeGreaterThan(0);
    const colDel = await request(app).delete(`/collections/${col.body.id}`);
    expect(colDel.status).toBe(200);
    const gone = await request(app).get('/collections');
    expect(gone.body.some((c: any) => c.id === col.body.id)).toBe(false);
    const leftover = await request(app).get('/requests');
    expect(leftover.body.some((r: any) => r.collection_id === col.body.id)).toBe(false);
  });

  it('environments, globals, cookies, history', async () => {
    const env = await request(app).post('/environments').send({
      name: 'Local',
      variables: [{ key: 'host', value: '127.0.0.1', enabled: true }],
    });
    expect(env.body.id).toBeGreaterThan(0);
    const envList = await request(app).get('/environments');
    expect(envList.body.length).toBeGreaterThan(0);
    await request(app).put(`/environments/${env.body.id}`).send({ name: 'Local 2', variables: [] });
    await request(app).delete(`/environments/${env.body.id}`);

    const g = await request(app).post('/globals').send({ key: 'k', value: 'v', secret: false });
    expect(g.body.key).toBe('k');
    await request(app).put(`/globals/${g.body.id}`).send({ key: 'k2', value: 'v2', secret: 0 });
    const gl = await request(app).get('/globals');
    expect(gl.body.some((x: any) => x.key === 'k2')).toBe(true);
    await request(app).delete(`/globals/${g.body.id}`);

    const cookie = await request(app).post('/cookies').send({ domain: 'example.com', name: 'sid', value: '1' });
    expect(cookie.body.ok).toBe(true);
    const cookies = await request(app).get('/cookies');
    expect(cookies.body[0].name).toBe('sid');
    await request(app).delete(`/cookies/${cookies.body[0].id}`);
    await request(app).delete('/cookies');

    const hist = await request(app).get('/history');
    expect(Array.isArray(hist.body)).toBe(true);
    await request(app).delete('/history');
  });

  it('execute hits a local server and writes history', async () => {
    const server = await new Promise<import('http').Server>((resolve) => {
      const http = require('http');
      const s = http.createServer((_req: any, res: any) => { res.end('pong'); });
      s.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = (server.address() as any).port;
    const res = await request(app).post('/execute').send({
      method: 'GET',
      url: `http://127.0.0.1:${port}/`,
      headers: [],
      params: [],
      body_type: 'none',
      auth_type: 'none',
      name: 'ping',
    });
    expect(res.status).toBe(200);
    expect(res.body.body).toBe('pong');
    const hist = await request(app).get('/history');
    expect(hist.body[0].name).toBe('ping');
    server.close();
  });

  it('runs a collection of HTTP requests', async () => {
    const col = await request(app).post('/collections').send({ name: 'Run' });
    const http = require('http');
    const server = await new Promise<any>((resolve) => {
      const s = http.createServer((_req: any, res: any) => { res.end('ok'); });
      s.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = server.address().port;
    await request(app).post('/requests').send({
      collection_id: col.body.id,
      name: 'A',
      method: 'GET',
      url: `http://127.0.0.1:${port}/`,
    });
    await request(app).post('/requests').send({
      collection_id: col.body.id,
      name: 'WS skip',
      method: 'WS',
      url: 'ws://127.0.0.1/x',
    });
    const run = await request(app).post(`/execute/collection/${col.body.id}`).send({});
    expect(run.body.results).toHaveLength(2);
    expect(run.body.results[0].status).toBe(200);
    expect(run.body.results[1].skipped).toBe(true);
    server.close();
  });

  it('executes collection auth inheritance', async () => {
    const col = await request(app).post('/collections').send({ name: 'AuthCol' });
    await request(app).put(`/collections/${col.body.id}`).send({
      auth_type: 'bearer',
      auth: { token: 'abc' },
    });
    let seen = '';
    const http = require('http');
    const server = await new Promise<any>((resolve) => {
      const s = http.createServer((req: any, res: any) => {
        seen = req.headers.authorization || '';
        res.end('ok');
      });
      s.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = server.address().port;
    await request(app).post('/execute').send({
      collection_id: col.body.id,
      method: 'GET',
      url: `http://127.0.0.1:${port}/`,
      auth_type: 'none',
      auth: {},
    });
    expect(seen).toBe('Bearer abc');
    server.close();
  });

  it('bruno import requires collectionId', async () => {
    const res = await request(app).post('/import-export/bru').send({});
    expect(res.status).toBe(400);
  });

  it('grpc execute validates input', async () => {
    const res = await request(app).post('/execute-grpc').send({});
    expect(res.status).toBe(400);
  });

  it.skipIf(!gitAvailable())('git folder: init, sync collections, commit', async () => {
    const col = await request(app).post('/collections').send({ name: 'Git Col', description: '' });
    expect(col.status).toBe(200);
    await request(app).post('/requests').send({
      collection_id: col.body.id,
      name: 'Ping',
      method: 'GET',
      url: 'http://127.0.0.1:8765/health',
    });

    const setFolder = await request(app).put('/git/folder').send({ path: repoDir });
    expect(setFolder.status).toBe(200);
    expect(setFolder.body.folder).toBe(repoDir);

    const init = await request(app).post('/git/init').send({});
    expect(init.status).toBe(200);
    expect(init.body.repo).toBe(true);

    runGit(repoDir, ['config', 'user.email', 'apiquick@test.local']);
    runGit(repoDir, ['config', 'user.name', 'Apiquick Test']);

    const sync = await request(app).post('/git/sync').send({});
    expect(sync.status).toBe(200);
    expect(sync.body.written.some((f: string) => f.includes('Git Col'))).toBe(true);

    const noMsg = await request(app).post('/git/commit').send({ message: '' });
    expect(noMsg.status).toBe(400);

    const commit = await request(app).post('/git/commit').send({ message: 'Add Git Col' });
    expect(commit.status).toBe(200);
    expect(commit.body.empty).not.toBe(true);

    const status = await request(app).get('/git/status');
    expect(status.body.dirty).toBe(false);
  });
});
