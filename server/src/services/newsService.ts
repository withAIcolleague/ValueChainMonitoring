import { db } from "../db/connection.js";
import type { News, NewsCategory, NewsInput } from "@valuechain/shared";
import { HttpError } from "../middleware/errorHandler.js";

interface NewsRow {
  id: number;
  stock_id: number;
  title: string;
  url: string;
  source: string | null;
  published_at: string | null;
  category: NewsCategory;
  origin: "AUTO" | "MANUAL";
  is_confirmed: number;
  collected_at: string;
}

function toNews(row: NewsRow): News {
  return {
    id: row.id,
    stockId: row.stock_id,
    title: row.title,
    url: row.url,
    source: row.source,
    publishedAt: row.published_at,
    category: row.category,
    origin: row.origin,
    isConfirmed: !!row.is_confirmed,
    collectedAt: row.collected_at,
  };
}

export function listNews(params: { stockId?: number; category?: NewsCategory; from?: string; to?: string }): News[] {
  const conditions: string[] = [];
  const args: Record<string, unknown> = {};

  if (params.stockId) {
    conditions.push("stock_id = @stockId");
    args.stockId = params.stockId;
  }
  if (params.category) {
    conditions.push("category = @category");
    args.category = params.category;
  }
  if (params.from) {
    conditions.push("published_at >= @from");
    args.from = params.from;
  }
  if (params.to) {
    conditions.push("published_at <= @to");
    args.to = params.to;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM news ${where} ORDER BY published_at DESC, id DESC LIMIT 500`)
    .all(args) as NewsRow[];
  return rows.map(toNews);
}

export function addManualNews(stockId: number, input: NewsInput): News {
  const result = db
    .prepare(
      `INSERT INTO news (stock_id, title, url, source, published_at, category, origin, is_confirmed)
       VALUES (@stockId, @title, @url, @source, @publishedAt, @category, 'MANUAL', 1)
       ON CONFLICT(stock_id, url) DO UPDATE SET
         title=excluded.title, source=excluded.source, published_at=excluded.published_at,
         category=excluded.category, origin='MANUAL', is_confirmed=1`,
    )
    .run({
      stockId,
      title: input.title,
      url: input.url,
      source: input.source ?? null,
      publishedAt: input.publishedAt ?? null,
      category: input.category,
    });
  const id = result.lastInsertRowid
    ? Number(result.lastInsertRowid)
    : (db.prepare("SELECT id FROM news WHERE stock_id=? AND url=?").get(stockId, input.url) as { id: number }).id;
  const row = db.prepare("SELECT * FROM news WHERE id = ?").get(id) as NewsRow;
  return toNews(row);
}

export function upsertAutoNews(stockId: number, item: { title: string; url: string; source?: string | null; publishedAt?: string | null; category: NewsCategory }): void {
  db.prepare(
    `INSERT INTO news (stock_id, title, url, source, published_at, category, origin, is_confirmed)
     VALUES (@stockId, @title, @url, @source, @publishedAt, @category, 'AUTO', 0)
     ON CONFLICT(stock_id, url) DO NOTHING`,
  ).run({
    stockId,
    title: item.title,
    url: item.url,
    source: item.source ?? null,
    publishedAt: item.publishedAt ?? null,
    category: item.category,
  });
}

export function updateNews(id: number, input: { category?: NewsCategory; isConfirmed?: boolean }): News {
  const existing = db.prepare("SELECT * FROM news WHERE id = ?").get(id) as NewsRow | undefined;
  if (!existing) throw new HttpError(404, "news not found");
  db.prepare(
    "UPDATE news SET category = @category, is_confirmed = @isConfirmed WHERE id = @id",
  ).run({
    id,
    category: input.category ?? existing.category,
    isConfirmed: input.isConfirmed === undefined ? existing.is_confirmed : input.isConfirmed ? 1 : 0,
  });
  const row = db.prepare("SELECT * FROM news WHERE id = ?").get(id) as NewsRow;
  return toNews(row);
}

export function deleteNews(id: number): void {
  db.prepare("DELETE FROM news WHERE id = ?").run(id);
}

export function latestNewsCategoryByStock(withinDays = 7): Map<number, NewsCategory> {
  const rows = db
    .prepare(
      `SELECT stock_id, category FROM news
       WHERE published_at >= datetime('now', @since) AND category != 'OTHER'
       ORDER BY published_at DESC`,
    )
    .all({ since: `-${withinDays} days` }) as { stock_id: number; category: NewsCategory }[];

  const map = new Map<number, NewsCategory>();
  for (const row of rows) {
    if (!map.has(row.stock_id)) map.set(row.stock_id, row.category);
  }
  return map;
}
