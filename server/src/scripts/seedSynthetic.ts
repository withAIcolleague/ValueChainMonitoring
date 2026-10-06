import { db } from "../db/connection.js";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  return Number(arg.split("=")[1]) || fallback;
}

const NODE_COUNT = parseArg("nodes", 500);
const EDGE_COUNT = parseArg("edges", 1500);

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

function seed() {
  console.log(`Seeding ${NODE_COUNT} stocks / ${EDGE_COUNT} relations...`);

  db.exec("DELETE FROM relations; DELETE FROM stock_products; DELETE FROM stock_themes; DELETE FROM news; DELETE FROM stock_links; DELETE FROM stocks; DELETE FROM products; DELETE FROM themes;");

  const relationTypeIds = (db.prepare("SELECT id, code FROM relation_types").all() as { id: number; code: string }[]).reduce(
    (acc, row) => ({ ...acc, [row.code]: row.id }),
    {} as Record<string, number>,
  );

  const insertStock = db.prepare(
    `INSERT INTO stocks (ticker, name, sector, market, market_cap, business_summary)
     VALUES (@ticker, @name, @sector, @market, @marketCap, @businessSummary)`,
  );
  const insertProduct = db.prepare("INSERT INTO products (name, category) VALUES (?, ?)");
  const insertTheme = db.prepare("INSERT INTO themes (name, color) VALUES (?, ?)");
  const insertStockProduct = db.prepare(
    `INSERT OR IGNORE INTO stock_products (stock_id, product_id, business_type, is_core, revenue_share)
     VALUES (?, ?, ?, 1, ?)`,
  );
  const insertStockTheme = db.prepare("INSERT OR IGNORE INTO stock_themes (stock_id, theme_id) VALUES (?, ?)");
  const insertRelation = db.prepare(
    `INSERT OR IGNORE INTO relations
       (source_stock_id, target_stock_id, relation_type_id, product_id, revenue_dependency_pct, weight, last_confirmed_at)
     VALUES (@source, @target, @relationTypeId, @productId, @dependency, @weight, datetime('now'))`,
  );

  const run = db.transaction(() => {
    const productIds = PRODUCT_NAMES.map((name) => Number(insertProduct.run(name, null).lastInsertRowid));
    const themeIds = THEME_NAMES.map((name) =>
      Number(insertTheme.run(name, `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`).lastInsertRowid),
    );

    const stockIds: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const sector = randomPick(SECTORS);
      const result = insertStock.run({
        ticker: `SYN${String(i).padStart(5, "0")}`,
        name: `${sector}기업${i}`,
        sector,
        market: randomPick(MARKETS),
        marketCap: Math.round(Math.random() * 500000) * 1_000_000,
        businessSummary: `${sector} 분야의 합성 테스트 기업`,
      });
      const stockId = Number(result.lastInsertRowid);
      stockIds.push(stockId);

      const themeCount = 1 + Math.floor(Math.random() * 2);
      for (let t = 0; t < themeCount; t++) insertStockTheme.run(stockId, randomPick(themeIds));

      const productCount = 1 + Math.floor(Math.random() * 3);
      for (let p = 0; p < productCount; p++) {
        insertStockProduct.run(stockId, randomPick(productIds), randomPick(BUSINESS_TYPES), Math.round(Math.random() * 100));
      }
    }

    // Preferential-attachment-ish edges: bias target selection toward earlier (hub) nodes.
    let created = 0;
    let attempts = 0;
    while (created < EDGE_COUNT && attempts < EDGE_COUNT * 5) {
      attempts += 1;
      const sourceIdx = Math.floor(Math.random() * stockIds.length);
      const targetIdx = Math.floor(Math.random() * Math.floor(Math.random() * stockIds.length + 1));
      if (sourceIdx === targetIdx) continue;

      const code = randomPick(RELATION_CODES);
      const result = insertRelation.run({
        source: stockIds[sourceIdx],
        target: stockIds[targetIdx],
        relationTypeId: relationTypeIds[code],
        productId: Math.random() < 0.7 ? randomPick(productIds) : null,
        dependency: Math.random() < 0.6 ? Math.round(Math.random() * 1000) / 10 : null,
        weight: 1 + Math.random() * 4,
      });
      if (result.changes > 0) created += 1;
    }

    console.log(`Created ${stockIds.length} stocks and ${created} relations.`);
  });

  run();
}

seed();
