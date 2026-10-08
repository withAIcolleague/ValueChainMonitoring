import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { GraphNode } from "@valuechain/shared";
import { useGraphStore } from "../../graph/graphStore";

interface StockListProps {
  nodes: GraphNode[];
  onSelect: (id: number) => void;
}

export function StockList({ nodes, onSelect }: StockListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const sectorFilter = useGraphStore((s) => s.sectorFilter);
  const marketFilter = useGraphStore((s) => s.marketFilter);
  const themeFilter = useGraphStore((s) => s.themeFilter);
  const businessTypeFilter = useGraphStore((s) => s.businessTypeFilter);
  const selectedStockId = useGraphStore((s) => s.selectedStockId);
  const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return nodes.filter((n) => {
      if (highlightedNodeIds.size > 0 && !highlightedNodeIds.has(n.id)) return false;
      if (q && !n.name.toLowerCase().includes(q) && !n.ticker.toLowerCase().includes(q)) return false;
      if (sectorFilter && n.sector !== sectorFilter) return false;
      if (marketFilter && n.market !== marketFilter) return false;
      if (themeFilter && !n.themeIds.includes(themeFilter)) return false;
      if (businessTypeFilter && !n.businessTypes.includes(businessTypeFilter)) return false;
      return true;
    });
  }, [nodes, searchQuery, sectorFilter, marketFilter, themeFilter, businessTypeFilter, highlightedNodeIds]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="stock-list">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((item) => {
          const node = filtered[item.index];
          return (
            <div
              key={node.id}
              className={`stock-list-item${selectedStockId === node.id ? " selected" : ""}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
              onClick={() => onSelect(node.id)}
            >
              <span className="stock-name">{node.name}</span>
              <span className="stock-ticker">{node.ticker}</span>
            </div>
          );
        })}
      </div>
      <div className="stock-list-count">{filtered.length}개 종목</div>
    </div>
  );
}
