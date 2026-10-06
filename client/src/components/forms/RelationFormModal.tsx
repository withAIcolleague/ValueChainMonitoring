import { useState } from "react";
import type { GraphPayload } from "@valuechain/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createRelation } from "../../api/relations";
import { createProduct } from "../../api/products";
import { useInvalidateGraph, useProductsQuery } from "../../hooks/queries";
import { Modal } from "./Modal";
import { StockPicker } from "./StockPicker";
import { Combobox } from "./Combobox";

interface RelationFormModalProps {
  payload: GraphPayload;
  defaultSourceId?: number;
  onClose: () => void;
}

export function RelationFormModal({ payload, defaultSourceId, onClose }: RelationFormModalProps) {
  const qc = useQueryClient();
  const invalidateGraph = useInvalidateGraph();
  const { data: products = [] } = useProductsQuery();

  const [sourceId, setSourceId] = useState<number | undefined>(defaultSourceId);
  const [targetId, setTargetId] = useState<number | undefined>(undefined);
  const [relationTypeId, setRelationTypeId] = useState<number>(payload.relationTypes[0]?.id ?? 0);
  const [productText, setProductText] = useState("");
  const [dependency, setDependency] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setError("공급사와 고객사를 모두 선택하세요.");
      return;
    }
    if (sourceId === targetId) {
      setError("두 종목이 같을 수 없습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let productId: number | undefined;
      if (productText.trim()) {
        const existing = products.find((p) => p.name === productText.trim());
        productId = existing ? existing.id : (await createProduct({ name: productText.trim() })).id;
      }
      await createRelation({
        sourceStockId: sourceId,
        targetStockId: targetId,
        relationTypeId,
        productId,
        revenueDependencyPct: dependency ? Number(dependency) : null,
        weight: 1,
        description: description || null,
        lastConfirmedAt: new Date().toISOString().slice(0, 10),
      });
      invalidateGraph();
      qc.invalidateQueries({ queryKey: ["stockRelations", sourceId] });
      qc.invalidateQueries({ queryKey: ["stockRelations", targetId] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="공급망 관계 추가" onClose={onClose}>
      <form onSubmit={handleSubmit} className="entity-form">
        <label>
          공급사 (source)
          <StockPicker id="rel-source" nodes={payload.nodes} value={sourceId} onChange={setSourceId} excludeId={targetId} />
        </label>
        <label>
          고객사 (target)
          <StockPicker id="rel-target" nodes={payload.nodes} value={targetId} onChange={setTargetId} excludeId={sourceId} />
        </label>
        <label>
          관계유형
          <select value={relationTypeId} onChange={(e) => setRelationTypeId(Number(e.target.value))}>
            {payload.relationTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.labelKo}</option>
            ))}
          </select>
        </label>
        <label>
          거래 품목 (선택)
          <Combobox
            id="relation-product"
            options={products.map((p) => ({ id: p.id, label: p.name }))}
            value={productText}
            onInputChange={setProductText}
            onSelect={(option) => setProductText(option.label)}
            placeholder="품목명 입력 (새 품목은 자동 등록)"
          />
        </label>
        <label>
          매출 의존도 (%)
          <input type="number" step="0.1" value={dependency} onChange={(e) => setDependency(e.target.value)} />
        </label>
        <label>
          비고
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {error && <span className="form-error">{error}</span>}
        <button type="submit" disabled={submitting} className="primary-button">추가</button>
      </form>
    </Modal>
  );
}
