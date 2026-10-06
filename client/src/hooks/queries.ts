import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStock } from "../api/stocks";
import { fetchStockProducts } from "../api/products";
import { fetchStockThemeIds } from "../api/themes";
import { fetchStockLinks } from "../api/links";
import { fetchNews } from "../api/news";
import { fetchRelations, fetchRelationTypes } from "../api/relations";
import { fetchProducts } from "../api/products";
import { fetchThemes } from "../api/themes";

export function useStockDetailQuery(stockId: number | null) {
  return useQuery({
    queryKey: ["stock", stockId],
    queryFn: () => fetchStock(stockId as number),
    enabled: stockId !== null,
  });
}

export function useStockProductsQuery(stockId: number | null) {
  return useQuery({
    queryKey: ["stockProducts", stockId],
    queryFn: () => fetchStockProducts(stockId as number),
    enabled: stockId !== null,
  });
}

export function useStockThemeIdsQuery(stockId: number | null) {
  return useQuery({
    queryKey: ["stockThemeIds", stockId],
    queryFn: () => fetchStockThemeIds(stockId as number),
    enabled: stockId !== null,
  });
}

export function useStockLinksQuery(stockId: number | null) {
  return useQuery({
    queryKey: ["stockLinks", stockId],
    queryFn: () => fetchStockLinks(stockId as number),
    enabled: stockId !== null,
  });
}

export function useStockNewsQuery(stockId: number | null) {
  return useQuery({
    queryKey: ["stockNews", stockId],
    queryFn: () => fetchNews({ stockId: stockId as number }),
    enabled: stockId !== null,
  });
}

export function useAllNewsQuery(category?: string) {
  return useQuery({
    queryKey: ["allNews", category],
    queryFn: () => fetchNews(category ? { category: category as any } : {}),
  });
}

export function useStockRelationsQuery(stockId: number | null) {
  return useQuery({
    queryKey: ["stockRelations", stockId],
    queryFn: () => fetchRelations({ stockId: stockId as number }),
    enabled: stockId !== null,
  });
}

export function useRelationTypesQuery() {
  return useQuery({ queryKey: ["relationTypes"], queryFn: fetchRelationTypes, staleTime: Infinity });
}

export function useProductsQuery() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts });
}

export function useThemesQuery() {
  return useQuery({ queryKey: ["themes"], queryFn: fetchThemes });
}

export function useInvalidateGraph() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["graph"] });
}
