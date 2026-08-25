import { describe, it, expect } from 'vitest';
import { replaceVariables, buildVariables, getPredefinedVariables, makeExecuteCounters } from '../utils/variables';
import { encodeFormBody, encodeMultipartBody, applyAuth, runPmScript } from '../utils/executor';

describe('replaceVariables', () => {
  it('replaces {{key}} tokens', () => {
    expect(replaceVariables('https://{{host}}/{{path}}', { host: 'api.test', path: 'v1' }))
      .toBe('https://api.test/v1');
  });

  it('returns empty input unchanged', () => {
    expect(replaceVariables('', { a: '1' })).toBe('');
  });
});

describe('buildVariables', () => {
  it('returns empty without env id', () => {
    expect(buildVariables(null, [])).toEqual({});
  });

  it('reads enabled env vars', () => {
    const envs = [{ id: 1, variables: [{ key: 'token', value: 'abc', enabled: true }, { key: 'skip', value: 'x', enabled: false }] }];
    expect(buildVariables(1, envs)).toEqual({ token: 'abc' });
  });
});

describe('predefined variables', () => {
  it('includes $timestamp', () => {
    const v = getPredefinedVariables();
    expect(v['$timestamp']).toMatch(/^\d+$/);
  });

  it('replaces each {{$guid}} uniquely', () => {
    const out = replaceVariables('{{$guid}} {{$guid}}', {});
    const parts = out.split(' ');
    expect(parts[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(parts[1]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(parts[0]).not.toBe(parts[1]);
  });

  it('increments {{$counter}} and named counters in one pass', () => {
    const ctx = makeExecuteCounters(true);
    const a = replaceVariables('n={{$counter}}', {}, ctx);
    const b = replaceVariables('n={{$counter}} id={{$counter:order}}', {}, ctx);
    expect(a).toBe('n=1');
    expect(b).toBe('n=1 id=1');
  });
});

describe('form encoding', () => {
  it('encodes urlencoded JSON fields', () => {
    const body = encodeFormBody(JSON.stringify([
      { key: 'a', value: '1', enabled: true },
      { key: 'b', value: '2', enabled: false },
    ]), {});
    expect(body).toBe('a=1');
  });

  it('builds multipart parts', () => {
    const { contentType, body } = encodeMultipartBody(JSON.stringify([{ key: 'file', value: 'x' }]), {});
    expect(contentType).toContain('multipart/form-data');
    expect(body).toContain('name="file"');
    expect(body).toContain('x');
  });
});

describe('applyAuth', () => {
  it('sets basic authorization', () => {
    const headers: Record<string, string> = {};
    applyAuth(headers, new URL('http://x.test'), 'basic', { username: 'u', password: 'p' });
    expect(headers.Authorization).toBe('Basic ' + Buffer.from('u:p').toString('base64'));
  });

  it('sets bearer and apikey header', () => {
    const headers: Record<string, string> = {};
    applyAuth(headers, new URL('http://x.test'), 'bearer', { token: 't' });
    expect(headers.Authorization).toBe('Bearer t');
    applyAuth(headers, new URL('http://x.test/?q=1'), 'apikey', { key: 'X-Key', value: 'v', addTo: 'header' });
    expect(headers['X-Key']).toBe('v');
  });

  it('puts apikey in query', () => {
    const url = new URL('http://x.test/');
    applyAuth({}, url, 'apikey', { key: 'k', value: 'v', addTo: 'query' });
    expect(url.searchParams.get('k')).toBe('v');
  });
});

describe('runPmScript', () => {
  it('sets variables and records passing tests', () => {
    const ctx = { vars: { a: '1' }, request: {}, response: { status: 200 }, tests: [] as any[] };
    const res = runPmScript(`
      pm.variables.set('a', '2');
      pm.test('ok', () => { pm.expect(pm.response.status).to.have.status(200); });
    `, ctx);
    expect(res.error).toBeUndefined();
    expect(ctx.vars.a).toBe('2');
    expect(ctx.tests[0].passed).toBe(true);
  });

  it('records failing tests', () => {
    const ctx = { vars: {}, request: {}, response: { status: 500 }, tests: [] as any[] };
    runPmScript(`pm.test('status', () => { pm.expect(1).to.equal(2); });`, ctx);
    expect(ctx.tests[0].passed).toBe(false);
  });

  it('blocks require', () => {
    const ctx = { vars: {}, request: {}, tests: [] };
    const res = runPmScript(`require('fs');`, ctx);
    expect(res.error).toMatch(/not allowed/);
  });
});
