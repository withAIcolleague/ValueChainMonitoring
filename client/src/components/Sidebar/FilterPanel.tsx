import type { GraphNode, Theme } from "@valuechain/shared";
import { useGraphStore } from "../../graph/graphStore";

interface FilterPanelProps {
  nodes: GraphNode[];
  themes: Theme[];
}

export function FilterPanel({ nodes, themes }: FilterPanelProps) {
  const sectorFilter = useGraphStore((s) => s.sectorFilter);
  const marketFilter = useGraphStore((s) => s.marketFilter);
  const themeFilter = useGraphStore((s) => s.themeFilter);
  const businessTypeFilter = useGraphStore((s) => s.businessTypeFilter);
  const setSectorFilter = useGraphStore((s) => s.setSectorFilter);
  const setMarketFilter = useGraphStore((s) => s.setMarketFilter);
  const setThemeFilter = useGraphStore((s) => s.setThemeFilter);
  const setBusinessTypeFilter = useGraphStore((s) => s.setBusinessTypeFilter);
  const showThemeColors = useGraphStore((s) => s.showThemeColors);
  const toggleThemeColors = useGraphStore((s) => s.toggleThemeColors);
  const highlightDepth = useGraphStore((s) => s.highlightDepth);
  const setHighlightDepth = useGraphStore((s) => s.setHighlightDepth);

  const sectors = Array.from(new Set(nodes.map((n) => n.sector).filter((v): v is string => !!v))).sort();
  const markets = Array.from(new Set(nodes.map((n) => n.market).filter((v): v is string => !!v))).sort();

  return (
    <div className="filter-panel">
      <select value={sectorFilter ?? ""} onChange={(e) => setSectorFilter(e.target.value || null)}>
        <option value="">전체 섹터</option>
        {sectors.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select value={marketFilter ?? ""} onChange={(e) => setMarketFilter(e.target.value || null)}>
        <option value="">전체 시장</option>
        {markets.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select value={themeFilter ?? ""} onChange={(e) => setThemeFilter(e.target.value ? Number(e.target.value) : null)}>
        <option value="">전체 테마</option>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <select value={businessTypeFilter ?? ""} onChange={(e) => setBusinessTypeFilter((e.target.value || null) as any)}>
        <option value="">전체 사업유형</option>
        <option value="B2G">B2G</option>
        <option value="B2B">B2B</option>
        <option value="B2C">B2C</option>
      </select>

      <label className="theme-toggle">
        <input type="checkbox" checked={showThemeColors} onChange={toggleThemeColors} />
        테마 색상 보기
      </label>

      <label className="depth-slider">
        연결 단계: {highlightDepth}단계
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={highlightDepth}
          onChange={(e) => setHighlightDepth(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
