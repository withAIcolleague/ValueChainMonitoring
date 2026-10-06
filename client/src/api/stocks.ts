import type { Stock, StockInput } from "@valuechain/shared";
import { api } from "./client";

export interface StockDetail extends Stock {
  upstreamCount: number;
  downstreamCount: number;
}

export function fetchStocks(params: { query?: string; sector?: string; market?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.query) qs.set("query", params.query);
  if (params.sector) qs.set("sector", params.sector);
  if (params.market) qs.set("market", params.market);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return api.get<Stock[]>(`/stocks${suffix}`);
}

export function fetchStock(id: number) {
  return api.get<StockDetail>(`/stocks/${id}`);
}

export function createStock(input: StockInput) {
  return api.post<Stock>("/stocks", input);
}

export function updateStock(id: number, input: Partial<StockInput>) {
  return api.put<Stock>(`/stocks/${id}`, input);
}

export function deleteStock(id: number) {
  return api.delete<void>(`/stocks/${id}`);
}
