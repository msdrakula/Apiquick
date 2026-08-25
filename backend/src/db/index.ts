import fs from 'fs';
import path from 'path';

function resolveDataDir() {
  return process.env.APIQUICK_DATA_DIR || process.env.GETMAN_DATA_DIR || path.join(__dirname, '..', '..', '..', 'data');
}

let DATA_DIR = resolveDataDir();
let dbPath = path.join(DATA_DIR, 'apiquick.db');

let db: any = null;
let SQL: any = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  const tmpPath = dbPath + '.tmp';
  fs.writeFileSync(tmpPath, Buffer.from(data.buffer, data.byteOffset, data.byteLength));
  fs.renameSync(tmpPath, dbPath);
}

function loadDb() {
  try {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
  } catch {
    db = new SQL.Database();
  }
}

export async function initDb(dataDir?: string) {
  DATA_DIR = dataDir || resolveDataDir();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  dbPath = path.join(DATA_DIR, 'apiquick.db');
  const legacyDb = path.join(DATA_DIR, 'getman.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(legacyDb)) {
    fs.renameSync(legacyDb, dbPath);
  }

  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();
  loadDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add collection columns if missing
  const addCol = (col: string, def: string) => {
    try { db.run(`ALTER TABLE collections ADD COLUMN ${col} ${def}`); } catch { /* already exists */ }
  };
  addCol('auth_type', 'TEXT DEFAULT \'none\'');
  addCol('auth', 'TEXT DEFAULT \'{}\'');
  addCol('pre_request_script', 'TEXT');
  addCol('test_script', 'TEXT');
  addCol('variables', 'TEXT DEFAULT \'[]\'');

  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'New Request',
      method TEXT NOT NULL DEFAULT 'GET',
      url TEXT NOT NULL DEFAULT '',
      headers TEXT DEFAULT '[]',
      params TEXT DEFAULT '[]',
      body_type TEXT DEFAULT 'none',
      body_content TEXT,
      body_raw_type TEXT DEFAULT 'json',
      auth_type TEXT DEFAULT 'none',
      auth TEXT DEFAULT '{}',
      pre_request_script TEXT,
      test_script TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const addReqCol = (col: string, def: string) => {
    try { db.run(`ALTER TABLE requests ADD COLUMN ${col} ${def}`); } catch { /* already exists */ }
  };
  addReqCol('grpc_service', 'TEXT');
  addReqCol('grpc_method', 'TEXT');
  addReqCol('grpc_proto', 'TEXT');
  addReqCol('grpc_message', 'TEXT');
  addReqCol('folder', "TEXT DEFAULT ''");
  addReqCol('captures', "TEXT DEFAULT '[]'");

  db.run(`
    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  try { db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('allowlist_enabled', '0')"); } catch { /* ok */ }
  try { db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('allowlist_hosts', '127.0.0.1,localhost')"); } catch { /* ok */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variables TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,
      name TEXT,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT DEFAULT '[]',
      params TEXT DEFAULT '[]',
      body_type TEXT DEFAULT 'none',
      body_content TEXT,
      response_status INTEGER,
      response_status_text TEXT,
      response_headers TEXT DEFAULT '[]',
      response_body TEXT,
      response_time_ms INTEGER,
      timeline TEXT,
      cookies TEXT,
      test_results TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS cookies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      path TEXT DEFAULT '/',
      secure INTEGER DEFAULT 0,
      http_only INTEGER DEFAULT 0,
      expires TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS globals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      secret INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDb();
}

let lastInsertId = 0;

function captureLastId() {
  if (!db) return;
  const result = db.exec('SELECT last_insert_rowid() AS id');
  lastInsertId = Number(result?.[0]?.values?.[0]?.[0] || 0);
}

function bindParams(stmt: any, params?: any) {
  if (params === undefined) return;
  stmt.bind(Array.isArray(params) ? params : [params]);
}

export function run(sql: string, params?: any): void {
  if (!db) throw new Error('DB not initialized');
  try {
    const stmt = db.prepare(sql);
    bindParams(stmt, params);
    stmt.step();
    captureLastId();
    stmt.free();
    if (!lastInsertId) captureLastId();
  } catch (e: any) {
    throw new Error(e?.message || String(e));
  }
  saveDb();
}

export function get(sql: string, params?: any): any {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  bindParams(stmt, params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function all(sql: string, params?: any): any[] {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  bindParams(stmt, params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function exec(sql: string): void {
  if (!db) throw new Error('DB not initialized');
  db.run(sql);
  saveDb();
}

export function lastId(_table?: string): number {
  return lastInsertId;
}

export function closeDb() {
  if (!db) return;
  saveDb();
  db.close();
  db = null;
}
