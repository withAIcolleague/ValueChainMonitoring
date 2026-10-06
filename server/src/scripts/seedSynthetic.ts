import { supabase } from "../db/supabaseClient.js";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  return Number(arg.split("=")[1]) || fallback;
}

const NODE_COUNT = parseArg("nodes", 500);
const EDGE_COUNT = parseArg("edges", 1500);
const CHUNK_SIZE = 500;

const SECTORS = ["반도체", "2차전지", "자동차", "바이오", "로봇", "조선", "방위산업", "IT서비스", "화학", "철강"];
const MARKETS = ["KOSPI", "KOSDAQ"];
const THEME_NAMES = ["2차전지", "AI반도체", "로봇", "방산", "원전", "수소", "우주항공", "조선기자재", "바이오시밀러", "자율주행"];
const PRODUCT_NAMES = [
  "양극재", "음극재", "전해액", "분리막", "파워모듈", "통신모듈", "센서", "디스플레이패널",
  "정밀가공부품", "주조부품", "항공전자장비", "방산전자부품", "원자로부품", "백신원료", "진단키트",
  "자율주행SW", "배터리셀", "전력반도체", "카메라모듈", "로봇암",
];
const RELATION_CODES = ["RAW_MATERIAL_SUPPLY", "COMPONENT_SUPPLY", "CUSTOMER", "DISTRIBUTOR", "COMPETITOR", "PARTNER"];
const BUSINESS_TYPES = ["B2G", "B2B", "B2C"] as const;

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
}

async function clearAll() {
  const { error: e1 } = await supabase.from("stocks").delete().neq("id", 0);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("products").delete().neq("id", 0);
  if (e2) throw e2;
  const { error: e3 } = await supabase.from("themes").delete().neq("id", 0);
  if (e3) throw e3;
}

async function insertInChunks(
  table: string,
  rows: Record<string, unknown>[],
  opts?: { onConflict: string },
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const query = opts
      ? supabase.from(table).upsert(chunk, { onConflict: opts.onConflict, ignoreDuplicates: true })
      : supabase.from(table).insert(chunk);
    const { data, error } = await query.select();
    if (error) throw error;
    inserted += data?.length ?? 0;
  }
  return inserted;
}

async function seed() {
  console.log(`Seeding ${NODE_COUNT} stocks / ${EDGE_COUNT} relations...`);

  await clearAll();

  const { data: relationTypeRows, error: rtError } = await supabase.from("relation_types").select("id, code");
  if (rtError) throw rtError;
  const relationTypeIds = Object.fromEntries(
    (relationTypeRows as { id: number; code: string }[]).map((r) => [r.code, r.id]),
  );

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .insert(PRODUCT_NAMES.map((name) => ({ name })))
    .select("id");
  if (productError) throw productError;
  const productIds = (productRows as { id: number }[]).map((r) => r.id);

  const { data: themeRows, error: themeError } = await supabase
    .from("themes")
    .insert(THEME_NAMES.map((name) => ({ name, color: randomColor() })))
    .select("id");
  if (themeError) throw themeError;
  const themeIds = (themeRows as { id: number }[]).map((r) => r.id);

  const stockPayload = Array.from({ length: NODE_COUNT }, (_, i) => {
    const sector = randomPick(SECTORS);
    return {
      ticker: `SYN${String(i).padStart(5, "0")}`,
      name: `${sector}기업${i}`,
      sector,
      market: randomPick(MARKETS),
      market_cap: Math.round(Math.random() * 500000) * 1_000_000,
      business_summary: `${sector} 분야의 합성 테스트 기업`,
    };
  });

  const stockIds: number[] = [];
  for (let i = 0; i < stockPayload.length; i += CHUNK_SIZE) {
    const chunk = stockPayload.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase.from("stocks").insert(chunk).select("id");
    if (error) throw error;
    stockIds.push(...(data as { id: number }[]).map((r) => r.id));
  }

  const stockThemeRows = stockIds.flatMap((stockId) => {
    const count = 1 + Math.floor(Math.random() * 2);
    return Array.from({ length: count }, () => ({ stock_id: stockId, theme_id: randomPick(themeIds) }));
  });
  const stockProductRows = stockIds.flatMap((stockId) => {
    const count = 1 + Math.floor(Math.random() * 3);
    return Array.from({ length: count }, () => ({
      stock_id: stockId,
      product_id: randomPick(productIds),
      business_type: randomPick(BUSINESS_TYPES),
      is_core: 1,
      revenue_share: Math.round(Math.random() * 100),
    }));
  });

  await insertInChunks("stock_themes", stockThemeRows, { onConflict: "stock_id,theme_id" });
  await insertInChunks("stock_products", stockProductRows, { onConflict: "stock_id,product_id,business_type" });

  // Preferential-attachment-ish edges, oversampled to absorb duplicate-pair rejections.
  const targetCandidates = Math.ceil(EDGE_COUNT * 1.3);
  const relationRows: Record<string, unknown>[] = [];
  for (let i = 0; i < targetCandidates; i++) {
    const sourceIdx = Math.floor(Math.random() * stockIds.length);
    const targetIdx = Math.floor(Math.random() * Math.floor(Math.random() * stockIds.length + 1));
    if (sourceIdx === targetIdx) continue;

    const code = randomPick(RELATION_CODES);
    relationRows.push({
      source_stock_id: stockIds[sourceIdx],
      target_stock_id: stockIds[targetIdx],
      relation_type_id: relationTypeIds[code],
      product_id: Math.random() < 0.7 ? randomPick(productIds) : null,
      revenue_dependency_pct: Math.random() < 0.6 ? Math.round(Math.random() * 1000) / 10 : null,
      weight: 1 + Math.random() * 4,
      last_confirmed_at: new Date().toISOString(),
    });
  }
  const createdEdges = await insertInChunks("relations", relationRows, {
    onConflict: "source_stock_id,target_stock_id,relation_type_id,product_id",
  });

  console.log(`Created ${stockIds.length} stocks and ~${createdEdges} relations.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
