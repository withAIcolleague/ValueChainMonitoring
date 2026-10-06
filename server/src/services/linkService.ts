import { db } from "../db/connection.js";
import type { StockLink, StockLinkInput } from "@valuechain/shared";

interface StockLinkRow {
  id: number;
  stock_id: number;
  label: string;
  url: string;
  created_at: string;
}

function toStockLink(row: StockLinkRow): StockLink {
  return { id: row.id, stockId: row.stock_id, label: row.label, url: row.url, createdAt: row.created_at };
}

export function listStockLinks(stockId: number): StockLink[] {
  const rows = db
    .prepare("SELECT * FROM stock_links WHERE stock_id = ? ORDER BY id")
    .all(stockId) as StockLinkRow[];
  return rows.map(toStockLink);
}

export function addStockLink(stockId: number, input: StockLinkInput): StockLink {
  const result = db
    .prepare("INSERT INTO stock_links (stock_id, label, url) VALUES (@stockId, @label, @url)")
    .run({ stockId, label: input.label, url: input.url });
  const row = db.prepare("SELECT * FROM stock_links WHERE id = ?").get(result.lastInsertRowid) as StockLinkRow;
  return toStockLink(row);
}

export function removeStockLink(stockId: number, linkId: number): void {
  db.prepare("DELETE FROM stock_links WHERE id = ? AND stock_id = ?").run(linkId, stockId);
}
