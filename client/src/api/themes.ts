import type { Theme, ThemeInput } from "@valuechain/shared";
import { api } from "./client";

export function fetchThemes() {
  return api.get<Theme[]>("/themes");
}

export function createTheme(input: ThemeInput) {
  return api.post<Theme>("/themes", input);
}

export function fetchStockThemeIds(stockId: number) {
  return api.get<number[]>(`/stocks/${stockId}/themes`);
}

export function addStockTheme(stockId: number, themeId: number) {
  return api.post<number[]>(`/stocks/${stockId}/themes`, { themeId });
}

export function removeStockTheme(stockId: number, themeId: number) {
  return api.delete<void>(`/stocks/${stockId}/themes/${themeId}`);
}
