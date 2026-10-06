CREATE TABLE IF NOT EXISTS stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT,
  market TEXT,
  market_cap REAL,
  business_summary TEXT,
  risk_notes TEXT,
  notes TEXT,
  pos_x REAL,
  pos_y REAL,
  layout_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS relation_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  label_ko TEXT NOT NULL,
  color TEXT NOT NULL,
  directionality TEXT NOT NULL DEFAULT 'directed' CHECK(directionality IN ('directed','undirected'))
);

CREATE TABLE IF NOT EXISTS layout_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  algorithm TEXT,
  last_computed_at TEXT,
  params_json TEXT
);
