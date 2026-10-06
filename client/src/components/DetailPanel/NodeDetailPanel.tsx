import type { GraphPayload } from "@valuechain/shared";
import {
  useStockDetailQuery,
  useStockLinksQuery,
  useStockNewsQuery,
  useStockProductsQuery,
  useStockRelationsQuery,
  useStockThemeIdsQuery,
} from "../../hooks/queries";
import { ProductList } from "./ProductList";
import { NewsTimeline } from "./NewsTimeline";
import { ExternalLinks } from "./ExternalLinks";

interface NodeDetailPanelProps {
  stockId: number;
  payload: GraphPayload;
  onClose: () => void;
  onEditStock: () => void;
  onAddRelation: () => void;
  onAddProduct: () => void;
  onAddTheme: () => void;
  onAddNews: () => void;
  onFocusStock: (id: number) => void;
}

export function NodeDetailPanel({
  stockId,
  payload,
  onClose,
  onEditStock,
  onAddRelation,
  onAddProduct,
  onAddTheme,
  onAddNews,
  onFocusStock,
}: NodeDetailPanelProps) {
  const { data: stock } = useStockDetailQuery(stockId);
  const { data: themeIds = [] } = useStockThemeIdsQuery(stockId);
  const { data: products = [] } = useStockProductsQuery(stockId);
  const { data: relations = [] } = useStockRelationsQuery(stockId);
  const { data: news = [] } = useStockNewsQuery(stockId);
  const { data: links = [] } = useStockLinksQuery(stockId);

  const nodeById = new Map(payload.nodes.map((n) => [n.id, n]));
  const relationTypeById = new Map(payload.relationTypes.map((rt) => [rt.id, rt]));
  const themeById = new Map(payload.themes.map((t) => [t.id, t]));

  const upstream = relations.filter((r) => r.targetStockId === stockId);
  const downstream = relations.filter((r) => r.sourceStockId === stockId);

  if (!stock) return null;

  return (
    <aside className="detail-panel">
      <div className="detail-panel-header">
        <h2>{stock.name} <span className="ticker">{stock.ticker}</span></h2>
        <button className="link-button" onClick={onClose}>닫기</button>
      </div>

      <div className="detail-panel-body">
        <section>
          <div className="section-header">
            <h3>개요</h3>
            <button className="link-button" onClick={onEditStock}>수정</button>
          </div>
          <p>{stock.sector} · {stock.market} {stock.marketCap ? `· 시가총액 ${(stock.marketCap / 1e8).toFixed(0)}억` : ""}</p>
          {stock.businessSummary && <p>{stock.businessSummary}</p>}
          {stock.riskNotes && <p className="risk-notes">⚠ {stock.riskNotes}</p>}
        </section>

        <section>
          <div className="section-header">
            <h3>소속 테마</h3>
            <button className="link-button" onClick={onAddTheme}>추가</button>
          </div>
          <div className="theme-chips">
            {themeIds.length === 0 && <p className="empty-hint">지정된 테마가 없습니다.</p>}
            {themeIds.map((id) => (
              <span key={id} className="theme-chip" style={{ borderColor: themeById.get(id)?.color ?? "#ccc" }}>
                {themeById.get(id)?.name}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="section-header">
            <h3>핵심 품목</h3>
            <button className="link-button" onClick={onAddProduct}>추가</button>
          </div>
          <ProductList stockId={stockId} products={products} />
        </section>

        <section>
          <div className="section-header">
            <h3>공급망 관계 (상류 {upstream.length} · 하류 {downstream.length})</h3>
            <button className="link-button" onClick={onAddRelation}>추가</button>
          </div>
          <h4>상류 공급사</h4>
          <ul className="relation-list">
            {upstream.map((r) => (
              <li key={r.id} onClick={() => onFocusStock(r.sourceStockId)}>
                <span className="relation-partner">{nodeById.get(r.sourceStockId)?.name}</span>
                <span className="relation-type" style={{ color: relationTypeById.get(r.relationTypeId)?.color }}>
                  {relationTypeById.get(r.relationTypeId)?.labelKo}
                </span>
                {r.productId && <span className="relation-product">{payload.edges.find(e => e.id === r.id)?.productName}</span>}
                {r.revenueDependencyPct != null && <span className="relation-dependency">매출의존 {r.revenueDependencyPct}%</span>}
              </li>
            ))}
            {upstream.length === 0 && <li className="empty-hint">없음</li>}
          </ul>
          <h4>하류 고객사</h4>
          <ul className="relation-list">
            {downstream.map((r) => (
              <li key={r.id} onClick={() => onFocusStock(r.targetStockId)}>
                <span className="relation-partner">{nodeById.get(r.targetStockId)?.name}</span>
                <span className="relation-type" style={{ color: relationTypeById.get(r.relationTypeId)?.color }}>
                  {relationTypeById.get(r.relationTypeId)?.labelKo}
                </span>
                {r.productId && <span className="relation-product">{payload.edges.find(e => e.id === r.id)?.productName}</span>}
                {r.revenueDependencyPct != null && <span className="relation-dependency">매출의존 {r.revenueDependencyPct}%</span>}
              </li>
            ))}
            {downstream.length === 0 && <li className="empty-hint">없음</li>}
          </ul>
        </section>

        <section>
          <div className="section-header">
            <h3>뉴스</h3>
            <button className="link-button" onClick={onAddNews}>직접 추가</button>
          </div>
          <NewsTimeline stockId={stockId} news={news} />
        </section>

        <section>
          <h3>외부 정보 링크</h3>
          <ExternalLinks stockId={stockId} links={links} />
        </section>
      </div>
    </aside>
  );
}
