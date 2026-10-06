import { db } from "../db/connection.js";
import type { Theme, ThemeInput } from "@valuechain/shared";

interface ThemeRow {
  id: number;
  name: string;
  color: string | null;
}

function toTheme(row: ThemeRow): Theme {
  return { id: row.id, name: row.name, color: row.color };
}

export function listThemes(): Theme[] {
  const rows = db.prepare("SELECT * FROM themes ORDER BY name").all() as ThemeRow[];
  return rows.map(toTheme);
}

export function createTheme(input: ThemeInput): Theme {
  const result = db
    .prepare("INSERT INTO themes (name, color) VALUES (@name, @color)")
    .run({ name: input.name, color: input.color ?? null });
  const row = db.prepare("SELECT * FROM themes WHERE id = ?").get(result.lastInsertRowid) as ThemeRow;
  return toTheme(row);
}

export function listStockThemeIds(stockId: number): number[] {
  const rows = db
    .prepare("SELECT theme_id FROM stock_themes WHERE stock_id = ?")
    .all(stockId) as { theme_id: number }[];
  return rows.map((r) => r.theme_id);
}

export function addStockTheme(stockId: number, themeId: number): void {
  db.prepare(
    "INSERT OR IGNORE INTO stock_themes (stock_id, theme_id) VALUES (?, ?)",
  ).run(stockId, themeId);
}

export function removeStockTheme(stockId: number, themeId: number): void {
  db.prepare("DELETE FROM stock_themes WHERE stock_id = ? AND theme_id = ?").run(stockId, themeId);
}
