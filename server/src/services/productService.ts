import { db } from "../db/connection.js";
import type { Product, ProductInput, StockProduct, StockProductInput } from "@valuechain/shared";
import { HttpError } from "../middleware/errorHandler.js";

interface ProductRow {
  id: number;
  name: string;
  category: string | null;
}

function toProduct(row: ProductRow): Product {
  return { id: row.id, name: row.name, category: row.category };
}

export function listProducts(): Product[] {
  const rows = db.prepare("SELECT * FROM products ORDER BY name").all() as ProductRow[];
  return rows.map(toProduct);
}

export function createProduct(input: ProductInput): Product {
  const result = db
    .prepare("INSERT INTO products (name, category) VALUES (@name, @category)")
    .run({ name: input.name, category: input.category ?? null });
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid) as ProductRow;
  return toProduct(row);
}

function findOrCreateProductByName(name: string): Product {
  const existing = db.prepare("SELECT * FROM products WHERE name = ?").get(name) as ProductRow | undefined;
  if (existing) return toProduct(existing);
  return createProduct({ name });
}

interface StockProductRow {
  stock_id: number;
  product_id: number;
  product_name: string;
  business_type: "B2G" | "B2B" | "B2C";
  is_core: number;
  revenue_share: number | null;
}

function toStockProduct(row: StockProductRow): StockProduct {
  return {
    stockId: row.stock_id,
    productId: row.product_id,
    productName: row.product_name,
    businessType: row.business_type,
    isCore: !!row.is_core,
    revenueShare: row.revenue_share,
  };
}

export function listStockProducts(stockId: number): StockProduct[] {
  const rows = db
    .prepare(
      `SELECT sp.*, p.name as product_name FROM stock_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.stock_id = ?
       ORDER BY sp.is_core DESC, p.name`,
    )
    .all(stockId) as StockProductRow[];
  return rows.map(toStockProduct);
}

export function addStockProduct(stockId: number, input: StockProductInput): StockProduct {
  let productId = input.productId;
  if (!productId) {
    if (!input.productName) {
      throw new HttpError(400, "productId or productName is required");
    }
    productId = findOrCreateProductByName(input.productName).id;
  }

  db.prepare(
    `INSERT INTO stock_products (stock_id, product_id, business_type, is_core, revenue_share)
     VALUES (@stockId, @productId, @businessType, @isCore, @revenueShare)
     ON CONFLICT(stock_id, product_id, business_type)
     DO UPDATE SET is_core = @isCore, revenue_share = @revenueShare`,
  ).run({
    stockId,
    productId,
    businessType: input.businessType,
    isCore: input.isCore ? 1 : 0,
    revenueShare: input.revenueShare ?? null,
  });

  const row = db
    .prepare(
      `SELECT sp.*, p.name as product_name FROM stock_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.stock_id = ? AND sp.product_id = ? AND sp.business_type = ?`,
    )
    .get(stockId, productId, input.businessType) as StockProductRow;
  return toStockProduct(row);
}

export function removeStockProduct(stockId: number, productId: number, businessType: string): void {
  db.prepare(
    "DELETE FROM stock_products WHERE stock_id = ? AND product_id = ? AND business_type = ?",
  ).run(stockId, productId, businessType);
}
