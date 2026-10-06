CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_products (
  stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL CHECK(business_type IN ('B2G','B2B','B2C')),
  is_core INTEGER NOT NULL DEFAULT 1,
  revenue_share REAL,
  PRIMARY KEY (stock_id, product_id, business_type)
);

CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_themes (
  stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  PRIMARY KEY (stock_id, theme_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_products_product ON stock_products(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_themes_theme ON stock_themes(theme_id);
