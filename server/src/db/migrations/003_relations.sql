CREATE TABLE IF NOT EXISTS relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  target_stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  relation_type_id INTEGER NOT NULL REFERENCES relation_types(id),
  product_id INTEGER REFERENCES products(id),
  revenue_dependency_pct REAL,
  weight REAL NOT NULL DEFAULT 1.0,
  description TEXT,
  last_confirmed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  UNIQUE(source_stock_id, target_stock_id, relation_type_id, product_id),
  CHECK(source_stock_id != target_stock_id)
);

CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_stock_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_stock_id);
CREATE INDEX IF NOT EXISTS idx_relations_product ON relations(product_id);
