import { db } from "../db/connection.js";
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
  product_name: string | null;
  revenue_dependency_pct: number | null;
  weight: number;
}

export function buildGraphPayload(): GraphPayload {
  ensureLayoutForAllNodes();

  const stockRows = db
    .prepare("SELECT id, ticker, name, sector, market, market_cap, pos_x, pos_y FROM stocks")
    .all() as StockRow[];

  const relationRows = db
    .prepare(
      `SELECT r.id, r.source_stock_id, r.target_stock_id, r.relation_type_id,
              r.product_id, p.name as product_name, r.revenue_dependency_pct, r.weight
       FROM relations r
       LEFT JOIN products p ON p.id = r.product_id`,
    )
    .all() as RelationRow[];

  const degree = new Map<number, number>();
  for (const r of relationRows) {
    degree.set(r.source_stock_id, (degree.get(r.source_stock_id) ?? 0) + 1);
    degree.set(r.target_stock_id, (degree.get(r.target_stock_id) ?? 0) + 1);
  }

  const themeRows = db.prepare("SELECT stock_id, theme_id FROM stock_themes").all() as {
    stock_id: number;
    theme_id: number;
  }[];
  const themesByStock = new Map<number, number[]>();
  for (const row of themeRows) {
    const arr = themesByStock.get(row.stock_id) ?? [];
    arr.push(row.theme_id);
    themesByStock.set(row.stock_id, arr);
  }

  const businessTypeRows = db
    .prepare("SELECT DISTINCT stock_id, business_type FROM stock_products")
    .all() as { stock_id: number; business_type: "B2G" | "B2B" | "B2C" }[];
  const businessTypesByStock = new Map<number, Array<"B2G" | "B2B" | "B2C">>();
  for (const row of businessTypeRows) {
    const arr = businessTypesByStock.get(row.stock_id) ?? [];
    arr.push(row.business_type);
    businessTypesByStock.set(row.stock_id, arr);
  }

  const newsMap = latestNewsCategoryByStock();

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
    productName: row.product_name,
    revenueDependencyPct: row.revenue_dependency_pct,
    weight: row.weight,
  }));

  return {
    nodes,
    edges,
    relationTypes: listRelationTypes(),
    themes: listThemes(),
  };
}
