import type { StockProduct } from "@valuechain/shared";
import { removeStockProduct } from "../../api/products";
import { useInvalidateGraph } from "../../hooks/queries";
import { useQueryClient } from "@tanstack/react-query";

interface ProductListProps {
  stockId: number;
  products: StockProduct[];
}

export function ProductList({ stockId, products }: ProductListProps) {
  const qc = useQueryClient();
  const invalidateGraph = useInvalidateGraph();

  async function handleRemove(productId: number, businessType: string) {
    await removeStockProduct(stockId, productId, businessType);
    qc.invalidateQueries({ queryKey: ["stockProducts", stockId] });
    invalidateGraph();
  }

  if (products.length === 0) {
    return <p className="empty-hint">등록된 핵심 품목이 없습니다.</p>;
  }

  return (
    <ul className="product-list">
      {products.map((p) => (
        <li key={`${p.productId}-${p.businessType}`}>
          <span className="product-name">{p.productName}</span>
          <span className={`badge badge-${p.businessType.toLowerCase()}`}>{p.businessType}</span>
          {p.isCore && <span className="badge badge-core">핵심</span>}
          {p.revenueShare != null && <span className="product-share">매출 {p.revenueShare}%</span>}
          <button className="link-button" onClick={() => handleRemove(p.productId, p.businessType)}>
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}
