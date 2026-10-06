import { supabase } from "../db/supabaseClient.js";
import type { Theme, ThemeInput } from "@valuechain/shared";
import { HttpError, pgErrorStatus } from "../middleware/errorHandler.js";

interface ThemeRow {
  id: number;
  name: string;
  color: string | null;
}

function toTheme(row: ThemeRow): Theme {
  return { id: row.id, name: row.name, color: row.color };
}

export async function listThemes(): Promise<Theme[]> {
  const { data, error } = await supabase.from("themes").select("*").order("name");
  if (error) throw new HttpError(500, error.message);
  return (data as ThemeRow[]).map(toTheme);
}

export async function createTheme(input: ThemeInput): Promise<Theme> {
  const { data, error } = await supabase
    .from("themes")
    .insert({ name: input.name, color: input.color ?? null })
    .select()
    .single();
  if (error) throw new HttpError(pgErrorStatus(error.code), error.message);
  return toTheme(data as ThemeRow);
}

export async function listStockThemeIds(stockId: number): Promise<number[]> {
  const { data, error } = await supabase.from("stock_themes").select("theme_id").eq("stock_id", stockId);
  if (error) throw new HttpError(500, error.message);
  return (data as { theme_id: number }[]).map((r) => r.theme_id);
}

export async function addStockTheme(stockId: number, themeId: number): Promise<void> {
  const { error } = await supabase
    .from("stock_themes")
    .upsert({ stock_id: stockId, theme_id: themeId }, { onConflict: "stock_id,theme_id" });
  if (error) throw new HttpError(pgErrorStatus(error.code), error.message);
}

export async function removeStockTheme(stockId: number, themeId: number): Promise<void> {
  const { error } = await supabase.from("stock_themes").delete().eq("stock_id", stockId).eq("theme_id", themeId);
  if (error) throw new HttpError(500, error.message);
}
