import { useRef, useState } from "react";
import { useGraphQuery } from "./hooks/useGraphQuery";
import { useStockDetailQuery } from "./hooks/queries";
import { useGraphStore } from "./graph/graphStore";
import { GraphCanvas, type GraphCanvasHandle } from "./graph/GraphCanvas";
import { SearchBar } from "./components/Sidebar/SearchBar";
import { FilterPanel } from "./components/Sidebar/FilterPanel";
import { StockList } from "./components/Sidebar/StockList";
import { NodeDetailPanel } from "./components/DetailPanel/NodeDetailPanel";
import { NewsFeedPanel } from "./components/NewsFeed/NewsFeedPanel";
import { StockFormModal } from "./components/forms/StockFormModal";
import { RelationFormModal } from "./components/forms/RelationFormModal";
import { ProductFormModal } from "./components/forms/ProductFormModal";
import { ThemeFormModal } from "./components/forms/ThemeFormModal";
import { NewsFormModal } from "./components/forms/NewsFormModal";
import "./App.css";

type ModalKind = "add-stock" | "edit-stock" | "add-relation" | "add-product" | "add-theme" | "add-news" | null;

function App() {
  const { data: payload, isLoading, error } = useGraphQuery();
  const graphRef = useRef<GraphCanvasHandle>(null);
  const selectedStockId = useGraphStore((s) => s.selectedStockId);
  const setSelectedStock = useGraphStore((s) => s.setSelectedStock);
  const clearHighlight = useGraphStore((s) => s.clearHighlight);
  const [modal, setModal] = useState<ModalKind>(null);
  const [showNewsFeed, setShowNewsFeed] = useState(false);
  const { data: editingStock } = useStockDetailQuery(modal === "edit-stock" ? selectedStockId : null);
  const mainBodyRef = useRef<HTMLDivElement>(null);

  function scrollMainBody(target: "top" | "bottom") {
    const el = mainBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: target === "top" ? 0 : el.scrollHeight, behavior: "smooth" });
  }

  function handleSelectFromList(id: number) {
    graphRef.current?.selectNode(id);
  }

  function handleFocusStock(id: number) {
    graphRef.current?.selectNode(id);
    setShowNewsFeed(false);
  }

  function closeDetail() {
    setSelectedStock(null);
    clearHighlight();
  }

  if (isLoading) return <div className="loading-screen">그래프를 불러오는 중...</div>;
  if (error || !payload) return <div className="loading-screen">그래프를 불러오지 못했습니다.</div>;

  return (
    <div className="app-layout">
      <header className="toolbar">
        <h1>ValueChain Monitoring</h1>
        <div className="toolbar-actions">
          <button className="secondary-button" onClick={() => graphRef.current?.recomputeLayout()}>
            레이아웃 재계산
          </button>
          <button className="secondary-button" onClick={() => graphRef.current?.zoomToFit()}>
            화면 맞춤
          </button>
          <button className="secondary-button" onClick={() => setShowNewsFeed((v) => !v)}>
            뉴스 피드
          </button>
          <button className="primary-button" onClick={() => setModal("add-stock")}>
            + 종목 추가
          </button>
        </div>
      </header>

      <div className="main-body" ref={mainBodyRef}>
        <aside className="sidebar">
          <SearchBar />
          <FilterPanel nodes={payload.nodes} themes={payload.themes} />
          <StockList nodes={payload.nodes} onSelect={handleSelectFromList} />
        </aside>

        <main className="graph-area">
          <GraphCanvas ref={graphRef} payload={payload} />
        </main>

        {selectedStockId !== null && (
          <NodeDetailPanel
            stockId={selectedStockId}
            payload={payload}
            onClose={closeDetail}
            onEditStock={() => setModal("edit-stock")}
            onAddRelation={() => setModal("add-relation")}
            onAddProduct={() => setModal("add-product")}
            onAddTheme={() => setModal("add-theme")}
            onAddNews={() => setModal("add-news")}
            onFocusStock={handleFocusStock}
          />
        )}

        {showNewsFeed && (
          <NewsFeedPanel payload={payload} onClose={() => setShowNewsFeed(false)} onFocusStock={handleFocusStock} />
        )}
      </div>

      <div className="mobile-scroll-fab">
        <button type="button" aria-label="맨 위로 이동" onClick={() => scrollMainBody("top")}>
          ▲
        </button>
        <button type="button" aria-label="맨 아래로 이동" onClick={() => scrollMainBody("bottom")}>
          ▼
        </button>
      </div>

      {modal === "add-stock" && (
        <StockFormModal existingNodes={payload.nodes} onClose={() => setModal(null)} />
      )}
      {modal === "edit-stock" && editingStock && (
        <StockFormModal stock={editingStock} existingNodes={payload.nodes} onClose={() => setModal(null)} />
      )}
      {modal === "add-relation" && (
        <RelationFormModal payload={payload} defaultSourceId={selectedStockId ?? undefined} onClose={() => setModal(null)} />
      )}
      {modal === "add-product" && selectedStockId !== null && (
        <ProductFormModal stockId={selectedStockId} onClose={() => setModal(null)} />
      )}
      {modal === "add-theme" && selectedStockId !== null && (
        <ThemeFormModal stockId={selectedStockId} onClose={() => setModal(null)} />
      )}
      {modal === "add-news" && selectedStockId !== null && (
        <NewsFormModal stockId={selectedStockId} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

export default App;
