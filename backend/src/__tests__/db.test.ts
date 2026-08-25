import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initDb, closeDb, run, lastId, get, all } from '../db';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apiquick-db-'));

describe('sql.js last insert', () => {
  beforeAll(async () => { await initDb(dir); });
  afterAll(() => { closeDb(); fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns the inserted collection id', () => {
    run("INSERT INTO collections (name, description) VALUES ('Alpha', 'desc')");
    const rows = all('SELECT * FROM collections');
    expect(rows.length, JSON.stringify(rows)).toBeGreaterThan(0);
    const id = lastId();
    expect(id).toBeGreaterThan(0);
    const row = get('SELECT * FROM collections WHERE id = ?', [id]);
    expect(row.name).toBe('Alpha');
  });
});
