import type { StockLink, StockLinkInput } from "@valuechain/shared";
import { api } from "./client";

export function fetchStockLinks(stockId: number) {
  return api.get<StockLink[]>(`/stocks/${stockId}/links`);
}

export function addStockLink(stockId: number, input: StockLinkInput) {
  return api.post<StockLink>(`/stocks/${stockId}/links`, input);
}

export function removeStockLink(stockId: number, linkId: number) {
  return api.delete<void>(`/stocks/${stockId}/links/${linkId}`);
}
