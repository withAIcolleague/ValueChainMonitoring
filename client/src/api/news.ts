import type { News, NewsCategory, NewsInput } from "@valuechain/shared";
import { api } from "./client";

export function fetchNews(params: { stockId?: number; category?: NewsCategory } = {}) {
  const qs = new URLSearchParams();
  if (params.stockId) qs.set("stockId", String(params.stockId));
  if (params.category) qs.set("category", params.category);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return api.get<News[]>(`/news${suffix}`);
}

export function addManualNews(stockId: number, input: NewsInput) {
  return api.post<News>(`/stocks/${stockId}/news`, input);
}

export function updateNews(id: number, input: { category?: NewsCategory; isConfirmed?: boolean }) {
  return api.put<News>(`/news/${id}`, input);
}

export function deleteNews(id: number) {
  return api.delete<void>(`/news/${id}`);
}

export function fetchNewsForStock(stockId: number) {
  return api.post<{ stockId: number; inserted: number }>(`/news/fetch/${stockId}`);
}
