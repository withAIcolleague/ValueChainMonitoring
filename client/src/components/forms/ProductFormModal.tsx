import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BusinessType } from "@valuechain/shared";
import { addStockProduct } from "../../api/products";
import { useInvalidateGraph, useProductsQuery } from "../../hooks/queries";
import { Modal } from "./Modal";
import { Combobox } from "./Combobox";

interface ProductFormModalProps {
  stockId: number;
  onClose: () => void;
}

const ALL_TYPES: BusinessType[] = ["B2G", "B2B", "B2C"];

export function ProductFormModal({ stockId, onClose }: ProductFormModalProps) {
  const qc = useQueryClient();
  const invalidateGraph = useInvalidateGraph();
  const { data: products = [] } = useProductsQuery();

  const [productName, setProductName] = useState("");
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>(["B2B"]);
  const [isCore, setIsCore] = useState(true);
  const [revenueShare, setRevenueShare] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleType(type: BusinessType) {
    setBusinessTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || businessTypes.length === 0) return;
    setSubmitting(true);
    try {
      for (const businessType of businessTypes) {
        await addStockProduct(stockId, {
          productName: productName.trim(),
          businessType,
          isCore,
          revenueShare: revenueShare ? Number(revenueShare) : null,
        });
      }
      qc.invalidateQueries({ queryKey: ["stockProducts", stockId] });
      invalidateGraph();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="핵심 품목 추가" onClose={onClose}>
      <form onSubmit={handleSubmit} className="entity-form">
        <label>
          품목명
          <Combobox
            id="product-name"
            options={products.map((p) => ({ id: p.id, label: p.name }))}
            value={productName}
            onInputChange={setProductName}
            onSelect={(option) => setProductName(option.label)}
            placeholder="품목명 입력 (새 품목은 자동 등록)"
          />
        </label>
        <label>
          사업유형 (중복 선택 가능)
          <div className="checkbox-row">
            {ALL_TYPES.map((t) => (
              <label key={t} className="checkbox-inline">
                <input type="checkbox" checked={businessTypes.includes(t)} onChange={() => toggleType(t)} />
                {t}
              </label>
            ))}
          </div>
        </label>
        <label className="checkbox-inline">
          <input type="checkbox" checked={isCore} onChange={(e) => setIsCore(e.target.checked)} />
          핵심 품목
        </label>
        <label>
          매출 비중 (%)
          <input type="number" step="0.1" value={revenueShare} onChange={(e) => setRevenueShare(e.target.value)} />
        </label>
        <button type="submit" disabled={submitting} className="primary-button">추가</button>
      </form>
    </Modal>
  );
}
