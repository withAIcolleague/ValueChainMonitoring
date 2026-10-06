import type { Product, ProductInput, StockProduct, StockProductInput } from "@valuechain/shared";
import { api } from "./client";

export function fetchProducts() {
  return api.get<Product[]>("/products");
}

export function createProduct(input: ProductInput) {
  return api.post<Product>("/products", input);
}

export function fetchStockProducts(stockId: number) {
  return api.get<StockProduct[]>(`/stocks/${stockId}/products`);
}

export function addStockProduct(stockId: number, input: StockProductInput) {
  return api.post<StockProduct>(`/stocks/${stockId}/products`, input);
}

export function removeStockProduct(stockId: number, productId: number, businessType: string) {
  return api.delete<void>(`/stocks/${stockId}/products/${productId}/${businessType}`);
}
