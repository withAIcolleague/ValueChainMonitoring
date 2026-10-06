import { create } from "zustand";

export type HighlightDirection = "upstream" | "downstream";

interface GraphUiState {
  selectedStockId: number | null;
  hoveredStockId: number | null;
  searchQuery: string;
  sectorFilter: string | null;
  marketFilter: string | null;
  themeFilter: number | null;
  businessTypeFilter: "B2G" | "B2B" | "B2C" | null;
  highlightDepth: number;
  highlightedNodeIds: Set<number>;
  highlightDirectionByNode: Map<number, HighlightDirection>;
  showThemeColors: boolean;

  setSelectedStock: (id: number | null) => void;
  setHoveredStock: (id: number | null) => void;
  setSearchQuery: (q: string) => void;
  setSectorFilter: (sector: string | null) => void;
  setMarketFilter: (market: string | null) => void;
  setThemeFilter: (themeId: number | null) => void;
  setBusinessTypeFilter: (bt: "B2G" | "B2B" | "B2C" | null) => void;
  setHighlightDepth: (depth: number) => void;
  setHighlight: (nodeIds: Set<number>, directions: Map<number, HighlightDirection>) => void;
  clearHighlight: () => void;
  toggleThemeColors: () => void;
}

export const useGraphStore = create<GraphUiState>((set) => ({
  selectedStockId: null,
  hoveredStockId: null,
  searchQuery: "",
  sectorFilter: null,
  marketFilter: null,
  themeFilter: null,
  businessTypeFilter: null,
  highlightDepth: 3,
  highlightedNodeIds: new Set(),
  highlightDirectionByNode: new Map(),
  showThemeColors: false,

  setSelectedStock: (id) => set({ selectedStockId: id }),
  setHoveredStock: (id) => set({ hoveredStockId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSectorFilter: (sector) => set({ sectorFilter: sector }),
  setMarketFilter: (market) => set({ marketFilter: market }),
  setThemeFilter: (themeId) => set({ themeFilter: themeId }),
  setBusinessTypeFilter: (bt) => set({ businessTypeFilter: bt }),
  setHighlightDepth: (depth) => set({ highlightDepth: depth }),
  setHighlight: (nodeIds, directions) =>
    set({ highlightedNodeIds: nodeIds, highlightDirectionByNode: directions }),
  clearHighlight: () => set({ highlightedNodeIds: new Set(), highlightDirectionByNode: new Map() }),
  toggleThemeColors: () => set((s) => ({ showThemeColors: !s.showThemeColors })),
}));
