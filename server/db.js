const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { logger } = require('./logger');

const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'cookie-clicker.sqlite');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

let dbInstance = null;

function initDatabase(dbPath = process.env.DB_PATH || DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  runMigrations(db);
  seedDefaultPlayer(db);

  dbInstance = db;
  return db;
}

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all();
  const applied = new Set(appliedRows.map(row => row.version));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
      file,
      new Date().toISOString()
    );
    logger.info('Database migration applied', { version: file });
  }
}

function seedDefaultPlayer(db) {
  const existing = db.prepare('SELECT id FROM players WHERE id = ?').get('player-default');
  if (existing) return;

  const nowIso = new Date().toISOString();
  db.prepare(
    `INSERT INTO players (
      id, username, cookies, cookies_per_second, total_produced, clicks,
      inventory_json, achievements_json, last_sync_timestamp, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'player-default',
    'Boulanger',
    0,
    0,
    0,
    0,
    JSON.stringify({ cursor: 0, grandma: 0 }),
    JSON.stringify([]),
    Date.now(),
    nowIso,
    nowIso
  );
}

function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function formatPlayerRow(row) {
  if (!row) return null;
  return {
    playerId: row.id,
    username: row.username,
    cookies: row.cookies,
    cookiesPerSecond: row.cookies_per_second,
    totalProduced: row.total_produced,
    clicks: row.clicks,
    inventory: JSON.parse(row.inventory_json || '{}'),
    achievements: JSON.parse(row.achievements_json || '[]'),
    lastSyncTimestamp: row.last_sync_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
  formatPlayerRow
};
