import { supabase } from "../db/supabaseClient.js";
import { fetchAllRows } from "../db/paginate.js";
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

export async function listNews(params: { stockId?: number; category?: NewsCategory; from?: string; to?: string }): Promise<News[]> {
  let q = supabase.from("news").select("*");

  if (params.stockId) q = q.eq("stock_id", params.stockId);
  if (params.category) q = q.eq("category", params.category);
  if (params.from) q = q.gte("published_at", params.from);
  if (params.to) q = q.lte("published_at", params.to);

  q = q.order("published_at", { ascending: false }).order("id", { ascending: false }).limit(500);

  const { data, error } = await q;
  if (error) throw new HttpError(500, error.message);
  return (data as NewsRow[]).map(toNews);
}

export async function addManualNews(stockId: number, input: NewsInput): Promise<News> {
  const { data, error } = await supabase
    .from("news")
    .upsert(
      {
        stock_id: stockId,
        title: input.title,
        url: input.url,
        source: input.source ?? null,
        published_at: input.publishedAt ?? null,
        category: input.category,
        origin: "MANUAL",
        is_confirmed: 1,
      },
      { onConflict: "stock_id,url" },
    )
    .select()
    .single();
  if (error) throw new HttpError(500, error.message);
  return toNews(data as NewsRow);
}

export async function upsertAutoNews(
  stockId: number,
  item: { title: string; url: string; source?: string | null; publishedAt?: string | null; category: NewsCategory },
): Promise<void> {
  const { error } = await supabase.from("news").upsert(
    {
      stock_id: stockId,
      title: item.title,
      url: item.url,
      source: item.source ?? null,
      published_at: item.publishedAt ?? null,
      category: item.category,
      origin: "AUTO",
      is_confirmed: 0,
    },
    { onConflict: "stock_id,url", ignoreDuplicates: true },
  );
  if (error) throw new HttpError(500, error.message);
}

export async function updateNews(id: number, input: { category?: NewsCategory; isConfirmed?: boolean }): Promise<News> {
  const { data: existing, error: fetchError } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  if (fetchError) throw new HttpError(500, fetchError.message);
  if (!existing) throw new HttpError(404, "news not found");

  const existingRow = existing as NewsRow;
  const { data, error } = await supabase
    .from("news")
    .update({
      category: input.category ?? existingRow.category,
      is_confirmed: input.isConfirmed === undefined ? existingRow.is_confirmed : input.isConfirmed ? 1 : 0,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new HttpError(500, error.message);
  return toNews(data as NewsRow);
}

export async function deleteNews(id: number): Promise<void> {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw new HttpError(500, error.message);
}

export async function latestNewsCategoryByStock(withinDays = 7): Promise<Map<number, NewsCategory>> {
  const since = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000).toISOString();
  const rows = await fetchAllRows<{ stock_id: number; category: NewsCategory }>((from, to) =>
    supabase
      .from("news")
      .select("stock_id, category")
      .gte("published_at", since)
      .neq("category", "OTHER")
      .order("published_at", { ascending: false })
      .range(from, to),
  );

  const map = new Map<number, NewsCategory>();
  for (const row of rows) {
    if (!map.has(row.stock_id)) map.set(row.stock_id, row.category);
  }
  return map;
}
