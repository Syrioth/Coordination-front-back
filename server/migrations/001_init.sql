CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  cookies REAL NOT NULL DEFAULT 0 CHECK (cookies >= 0),
  cookies_per_second REAL NOT NULL DEFAULT 0 CHECK (cookies_per_second >= 0),
  total_produced REAL NOT NULL DEFAULT 0 CHECK (total_produced >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  inventory_json TEXT NOT NULL DEFAULT '{"cursor":0,"grandma":0}',
  achievements_json TEXT NOT NULL DEFAULT '[]',
  last_sync_timestamp INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
