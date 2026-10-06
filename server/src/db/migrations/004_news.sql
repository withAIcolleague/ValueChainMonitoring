CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT,
  published_at TEXT,
  category TEXT NOT NULL DEFAULT 'OTHER' CHECK(category IN ('CONTRACT','CANCELLATION','ACHIEVEMENT','EARNINGS','OTHER')),
  origin TEXT NOT NULL DEFAULT 'AUTO' CHECK(origin IN ('AUTO','MANUAL')),
  is_confirmed INTEGER NOT NULL DEFAULT 0,
  collected_at TEXT DEFAULT (datetime('now')),
  UNIQUE(stock_id, url)
);

CREATE INDEX IF NOT EXISTS idx_news_stock ON news(stock_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);
