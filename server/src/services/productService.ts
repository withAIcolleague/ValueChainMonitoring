import { supabase } from "../db/supabaseClient.js";
import type { Product, ProductInput, StockProduct, StockProductInput } from "@valuechain/shared";
import { HttpError, pgErrorStatus } from "../middleware/errorHandler.js";

interface ProductRow {
  id: number;
  name: string;
  category: string | null;
}

function toProduct(row: ProductRow): Product {
  return { id: row.id, name: row.name, category: row.category };
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw new HttpError(500, error.message);
  return (data as ProductRow[]).map(toProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({ name: input.name, category: input.category ?? null })
    .select()
    .single();
  if (error) throw new HttpError(pgErrorStatus(error.code), error.message);
  return toProduct(data as ProductRow);
}

async function findOrCreateProductByName(name: string): Promise<Product> {
  const { data, error } = await supabase.from("products").select("*").eq("name", name).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (data) return toProduct(data as ProductRow);

  try {
    return await createProduct({ name });
  } catch (err) {
    // Another request may have created it concurrently between our select and insert.
    if (err instanceof HttpError && err.status === 409) {
      const retry = await supabase.from("products").select("*").eq("name", name).maybeSingle();
      if (retry.data) return toProduct(retry.data as ProductRow);
    }
    throw err;
  }
}

interface StockProductRow {
  stock_id: number;
  product_id: number;
  business_type: "B2G" | "B2B" | "B2C";
  is_core: number;
  revenue_share: number | null;
  products?: { name: string } | null;
}

function toStockProduct(row: StockProductRow): StockProduct {
  return {
    stockId: row.stock_id,
    productId: row.product_id,
    productName: row.products?.name,
    businessType: row.business_type,
    isCore: !!row.is_core,
    revenueShare: row.revenue_share,
  };
}

export async function listStockProducts(stockId: number): Promise<StockProduct[]> {
  const { data, error } = await supabase
    .from("stock_products")
    .select("*, products(name)")
    .eq("stock_id", stockId)
    .order("is_core", { ascending: false })
    .order("name", { ascending: true, foreignTable: "products" });
  if (error) throw new HttpError(500, error.message);
  return (data as StockProductRow[]).map(toStockProduct);
}

export async function addStockProduct(stockId: number, input: StockProductInput): Promise<StockProduct> {
  let productId = input.productId;
  if (!productId) {
    if (!input.productName) {
      throw new HttpError(400, "productId or productName is required");
    }
    productId = (await findOrCreateProductByName(input.productName)).id;
  }

  const { error: upsertError } = await supabase.from("stock_products").upsert(
    {
      stock_id: stockId,
      product_id: productId,
      business_type: input.businessType,
      is_core: input.isCore ? 1 : 0,
      revenue_share: input.revenueShare ?? null,
    },
    { onConflict: "stock_id,product_id,business_type" },
  );
  if (upsertError) throw new HttpError(pgErrorStatus(upsertError.code), upsertError.message);

  const { data, error } = await supabase
    .from("stock_products")
    .select("*, products(name)")
    .eq("stock_id", stockId)
    .eq("product_id", productId)
    .eq("business_type", input.businessType)
    .single();
  if (error) throw new HttpError(500, error.message);
  return toStockProduct(data as StockProductRow);
}

export async function removeStockProduct(stockId: number, productId: number, businessType: string): Promise<void> {
  const { error } = await supabase
    .from("stock_products")
    .delete()
    .eq("stock_id", stockId)
    .eq("product_id", productId)
    .eq("business_type", businessType);
  if (error) throw new HttpError(500, error.message);
}
