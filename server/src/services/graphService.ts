import { supabase } from "../db/supabaseClient.js";
import { fetchAllRows } from "../db/paginate.js";
import type { GraphEdge, GraphNode, GraphPayload } from "@valuechain/shared";
import { listRelationTypes } from "./relationService.js";
import { listThemes } from "./themeService.js";
import { latestNewsCategoryByStock } from "./newsService.js";
import { ensureLayoutForAllNodes } from "./layoutService.js";

interface StockRow {
  id: number;
  ticker: string;
  name: string;
  sector: string | null;
  market: string | null;
  market_cap: number | null;
  pos_x: number | null;
  pos_y: number | null;
}

interface RelationRow {
  id: number;
  source_stock_id: number;
  target_stock_id: number;
  relation_type_id: number;
  product_id: number | null;
  revenue_dependency_pct: number | null;
  weight: number;
  products: { name: string } | null;
}

export async function buildGraphPayload(): Promise<GraphPayload> {
  await ensureLayoutForAllNodes();

  const [stockRows, relationRows, themeRows, bizRows, relationTypes, themes, newsMap] = await Promise.all([
    fetchAllRows<StockRow>((from, to) =>
      supabase
        .from("stocks")
        .select("id, ticker, name, sector, market, market_cap, pos_x, pos_y")
        .range(from, to),
    ),
    fetchAllRows<RelationRow>((from, to) =>
      supabase
        .from("relations")
        .select("id, source_stock_id, target_stock_id, relation_type_id, product_id, revenue_dependency_pct, weight, products(name)")
        .range(from, to) as unknown as PromiseLike<{ data: RelationRow[] | null; error: { message: string } | null }>,
    ),
    fetchAllRows<{ stock_id: number; theme_id: number }>((from, to) =>
      supabase.from("stock_themes").select("stock_id, theme_id").range(from, to),
    ),
    fetchAllRows<{ stock_id: number; business_type: "B2G" | "B2B" | "B2C" }>((from, to) =>
      supabase.from("stock_products").select("stock_id, business_type").range(from, to),
    ),
    listRelationTypes(),
    listThemes(),
    latestNewsCategoryByStock(),
  ]);

  const degree = new Map<number, number>();
  for (const r of relationRows) {
    degree.set(r.source_stock_id, (degree.get(r.source_stock_id) ?? 0) + 1);
    degree.set(r.target_stock_id, (degree.get(r.target_stock_id) ?? 0) + 1);
  }

  const themesByStock = new Map<number, number[]>();
  for (const row of themeRows) {
    const arr = themesByStock.get(row.stock_id) ?? [];
    arr.push(row.theme_id);
    themesByStock.set(row.stock_id, arr);
  }

  const businessTypesByStock = new Map<number, Array<"B2G" | "B2B" | "B2C">>();
  for (const row of bizRows) {
    const arr = businessTypesByStock.get(row.stock_id) ?? [];
    if (!arr.includes(row.business_type)) arr.push(row.business_type);
    businessTypesByStock.set(row.stock_id, arr);
  }

  const nodes: GraphNode[] = stockRows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    sector: row.sector,
    market: row.market,
    marketCap: row.market_cap,
    x: row.pos_x ?? 0,
    y: row.pos_y ?? 0,
    degree: degree.get(row.id) ?? 0,
    themeIds: themesByStock.get(row.id) ?? [],
    businessTypes: businessTypesByStock.get(row.id) ?? [],
    latestNewsCategory: newsMap.get(row.id) ?? null,
  }));

  const edges: GraphEdge[] = relationRows.map((row) => ({
    id: row.id,
    source: row.source_stock_id,
    target: row.target_stock_id,
    relationTypeId: row.relation_type_id,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    revenueDependencyPct: row.revenue_dependency_pct,
    weight: row.weight,
  }));

  return { nodes, edges, relationTypes, themes };
}
