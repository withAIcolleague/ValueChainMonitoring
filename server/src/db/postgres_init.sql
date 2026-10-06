-- Postgres (Supabase) version of the SQLite migrations 001-006, isolated under its own schema
-- so it can safely share a Supabase project/database with unrelated apps.

CREATE SCHEMA IF NOT EXISTS valuechain;

CREATE TABLE IF NOT EXISTS valuechain.stocks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT,
  market TEXT,
  market_cap DOUBLE PRECISION,
  business_summary TEXT,
  risk_notes TEXT,
  notes TEXT,
  pos_x DOUBLE PRECISION,
  pos_y DOUBLE PRECISION,
  layout_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (now()::text),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS valuechain.relation_types (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label_ko TEXT NOT NULL,
  color TEXT NOT NULL,
  directionality TEXT NOT NULL DEFAULT 'directed' CHECK (directionality IN ('directed','undirected'))
);

CREATE TABLE IF NOT EXISTS valuechain.layout_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  algorithm TEXT,
  last_computed_at TEXT,
  params_json TEXT
);

CREATE TABLE IF NOT EXISTS valuechain.products (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TEXT DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS valuechain.stock_products (
  stock_id INTEGER NOT NULL REFERENCES valuechain.stocks(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES valuechain.products(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL CHECK (business_type IN ('B2G','B2B','B2C')),
  is_core INTEGER NOT NULL DEFAULT 1,
  revenue_share DOUBLE PRECISION,
  PRIMARY KEY (stock_id, product_id, business_type)
);

CREATE TABLE IF NOT EXISTS valuechain.themes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS valuechain.stock_themes (
  stock_id INTEGER NOT NULL REFERENCES valuechain.stocks(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES valuechain.themes(id) ON DELETE CASCADE,
  PRIMARY KEY (stock_id, theme_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_products_product ON valuechain.stock_products(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_themes_theme ON valuechain.stock_themes(theme_id);

CREATE TABLE IF NOT EXISTS valuechain.relations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_stock_id INTEGER NOT NULL REFERENCES valuechain.stocks(id) ON DELETE CASCADE,
  target_stock_id INTEGER NOT NULL REFERENCES valuechain.stocks(id) ON DELETE CASCADE,
  relation_type_id INTEGER NOT NULL REFERENCES valuechain.relation_types(id),
  product_id INTEGER REFERENCES valuechain.products(id),
  revenue_dependency_pct DOUBLE PRECISION,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  description TEXT,
  last_confirmed_at TEXT,
  created_at TEXT DEFAULT (now()::text),
  updated_at TEXT,
  UNIQUE (source_stock_id, target_stock_id, relation_type_id, product_id),
  CHECK (source_stock_id != target_stock_id)
);

CREATE INDEX IF NOT EXISTS idx_relations_source ON valuechain.relations(source_stock_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON valuechain.relations(target_stock_id);
CREATE INDEX IF NOT EXISTS idx_relations_product ON valuechain.relations(product_id);

CREATE TABLE IF NOT EXISTS valuechain.news (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES valuechain.stocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT,
  published_at TEXT,
  category TEXT NOT NULL DEFAULT 'OTHER' CHECK (category IN ('CONTRACT','CANCELLATION','ACHIEVEMENT','EARNINGS','OTHER')),
  origin TEXT NOT NULL DEFAULT 'AUTO' CHECK (origin IN ('AUTO','MANUAL')),
  is_confirmed INTEGER NOT NULL DEFAULT 0,
  collected_at TEXT DEFAULT (now()::text),
  UNIQUE (stock_id, url)
);

CREATE INDEX IF NOT EXISTS idx_news_stock ON valuechain.news(stock_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON valuechain.news(published_at);

CREATE TABLE IF NOT EXISTS valuechain.stock_links (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES valuechain.stocks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (now()::text)
);

CREATE INDEX IF NOT EXISTS idx_links_stock ON valuechain.stock_links(stock_id);

INSERT INTO valuechain.relation_types (code, label_ko, color, directionality) VALUES
  ('RAW_MATERIAL_SUPPLY', '원재료 공급', '#2563eb', 'directed'),
  ('COMPONENT_SUPPLY', '부품 공급', '#0891b2', 'directed'),
  ('CUSTOMER', '고객사', '#ea580c', 'directed'),
  ('DISTRIBUTOR', '유통/판매', '#65a30d', 'directed'),
  ('COMPETITOR', '경쟁사', '#dc2626', 'undirected'),
  ('PARTNER', '파트너/제휴', '#7c3aed', 'undirected')
ON CONFLICT (code) DO NOTHING;
