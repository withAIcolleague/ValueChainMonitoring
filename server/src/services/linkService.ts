import { supabase } from "../db/supabaseClient.js";
import type { StockLink, StockLinkInput } from "@valuechain/shared";
import { HttpError } from "../middleware/errorHandler.js";

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

export async function listStockLinks(stockId: number): Promise<StockLink[]> {
  const { data, error } = await supabase.from("stock_links").select("*").eq("stock_id", stockId).order("id");
  if (error) throw new HttpError(500, error.message);
  return (data as StockLinkRow[]).map(toStockLink);
}

export async function addStockLink(stockId: number, input: StockLinkInput): Promise<StockLink> {
  const { data, error } = await supabase
    .from("stock_links")
    .insert({ stock_id: stockId, label: input.label, url: input.url })
    .select()
    .single();
  if (error) throw new HttpError(500, error.message);
  return toStockLink(data as StockLinkRow);
}

export async function removeStockLink(stockId: number, linkId: number): Promise<void> {
  const { error } = await supabase.from("stock_links").delete().eq("id", linkId).eq("stock_id", stockId);
  if (error) throw new HttpError(500, error.message);
}
