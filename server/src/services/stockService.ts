import { supabase } from "../db/supabaseClient.js";
import type { Stock, StockInput } from "@valuechain/shared";
import { HttpError, pgErrorStatus } from "../middleware/errorHandler.js";

interface StockRow {
  id: number;
  ticker: string;
  name: string;
  sector: string | null;
  market: string | null;
  market_cap: number | null;
  business_summary: string | null;
  risk_notes: string | null;
  notes: string | null;
  pos_x: number | null;
  pos_y: number | null;
  layout_pinned: number;
  created_at: string;
  updated_at: string | null;
}

function toStock(row: StockRow): Stock {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    sector: row.sector,
    market: row.market,
    marketCap: row.market_cap,
    businessSummary: row.business_summary,
    riskNotes: row.risk_notes,
    notes: row.notes,
    posX: row.pos_x,
    posY: row.pos_y,
    layoutPinned: !!row.layout_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Escapes PostgREST's `.or()` filter-syntax metacharacters (comma separates
 * conditions, parens group them) so a search term like "LG(주)" can't break
 * out of the intended ilike filter. */
function escapeOrFilterValue(value: string): string {
  return value.replace(/[,()]/g, "\\$&");
}

export async function listStocks(params: { query?: string; sector?: string; market?: string; limit?: number; offset?: number }): Promise<Stock[]> {
  let q = supabase.from("stocks").select("*").order("name");

  if (params.query) {
    const term = escapeOrFilterValue(params.query);
    q = q.or(`name.ilike.%${term}%,ticker.ilike.%${term}%`);
  }
  if (params.sector) q = q.eq("sector", params.sector);
  if (params.market) q = q.eq("market", params.market);

  const limit = params.limit ?? 500;
  const offset = params.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) throw new HttpError(500, error.message);
  return (data as StockRow[]).map(toStock);
}

export async function getStock(id: number): Promise<Stock> {
  const { data, error } = await supabase.from("stocks").select("*").eq("id", id).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, "stock not found");
  return toStock(data as StockRow);
}

export async function createStock(input: StockInput): Promise<Stock> {
  const { data, error } = await supabase
    .from("stocks")
    .insert({
      ticker: input.ticker,
      name: input.name,
      sector: input.sector ?? null,
      market: input.market ?? null,
      market_cap: input.marketCap ?? null,
      business_summary: input.businessSummary ?? null,
      risk_notes: input.riskNotes ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new HttpError(pgErrorStatus(error.code), error.message);
  return toStock(data as StockRow);
}

export async function updateStock(id: number, input: Partial<StockInput>): Promise<Stock> {
  const existing = await getStock(id);
  const merged = { ...existing, ...input };
  const { data, error } = await supabase
    .from("stocks")
    .update({
      ticker: merged.ticker,
      name: merged.name,
      sector: merged.sector ?? null,
      market: merged.market ?? null,
      market_cap: merged.marketCap ?? null,
      business_summary: merged.businessSummary ?? null,
      risk_notes: merged.riskNotes ?? null,
      notes: merged.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new HttpError(500, error.message);
  return toStock(data as StockRow);
}

export async function deleteStock(id: number): Promise<void> {
  const { error } = await supabase.from("stocks").delete().eq("id", id);
  if (error) throw new HttpError(500, error.message);
}

export async function getStockStats(id: number): Promise<{ upstreamCount: number; downstreamCount: number }> {
  const [upstream, downstream] = await Promise.all([
    supabase.from("relations").select("*", { count: "exact", head: true }).eq("target_stock_id", id),
    supabase.from("relations").select("*", { count: "exact", head: true }).eq("source_stock_id", id),
  ]);
  if (upstream.error) throw new HttpError(500, upstream.error.message);
  if (downstream.error) throw new HttpError(500, downstream.error.message);
  return { upstreamCount: upstream.count ?? 0, downstreamCount: downstream.count ?? 0 };
}
