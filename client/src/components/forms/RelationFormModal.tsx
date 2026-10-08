import { useMemo, useRef, useState } from "react";
import type { GraphPayload } from "@valuechain/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createRelation } from "../../api/relations";
import { createProduct } from "../../api/products";
import { useInvalidateGraph, useProductsQuery, useStockProductsQuery } from "../../hooks/queries";
import { Modal } from "./Modal";
import { StockPicker } from "./StockPicker";
import { Combobox } from "./Combobox";

interface RelationFormModalProps {
  payload: GraphPayload;
  defaultSourceId?: number;
  onClose: () => void;
}

type Direction = "counterpartIsSource" | "counterpartIsTarget";

interface RelationRow {
  key: number;
  counterpartId: number | undefined;
  direction: Direction;
  relationTypeId: number;
  productText: string;
  dependency: string;
  description: string;
  error: string | null;
}

function makeRow(key: number, relationTypeId: number): RelationRow {
  return {
    key,
    counterpartId: undefined,
    direction: "counterpartIsSource",
    relationTypeId,
    productText: "",
    dependency: "",
    description: "",
    error: null,
  };
}

export function RelationFormModal({ payload, defaultSourceId, onClose }: RelationFormModalProps) {
  const qc = useQueryClient();
  const invalidateGraph = useInvalidateGraph();
  const { data: products = [] } = useProductsQuery();
  const nextKey = useRef(1);
  const defaultRelationTypeId = payload.relationTypes[0]?.id ?? 0;

  const anchorId = defaultSourceId;
  const anchorNode = payload.nodes.find((n) => n.id === anchorId);
  const [rows, setRows] = useState<RelationRow[]>([makeRow(nextKey.current++, defaultRelationTypeId)]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateRow(key: number, patch: Partial<RelationRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, error: null } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow(nextKey.current++, defaultRelationTypeId)]);
  }

  function removeRow(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anchorId) {
      setFormError("기준 종목을 찾을 수 없습니다.");
      return;
    }
    setFormError(null);
    setSubmitting(true);

    const remaining: RelationRow[] = [];
    let anySucceeded = false;

    for (const row of rows) {
      if (!row.counterpartId) {
        remaining.push({ ...row, error: "상대 종목을 선택하세요." });
        continue;
      }
      if (row.counterpartId === anchorId) {
        remaining.push({ ...row, error: "기준 종목과 같을 수 없습니다." });
        continue;
      }
      const sourceId = row.direction === "counterpartIsSource" ? row.counterpartId : anchorId;
      const targetId = row.direction === "counterpartIsSource" ? anchorId : row.counterpartId;
      try {
        let productId: number | undefined;
        if (row.productText.trim()) {
          const existing = products.find((p) => p.name === row.productText.trim());
          productId = existing ? existing.id : (await createProduct({ name: row.productText.trim() })).id;
        }
        await createRelation({
          sourceStockId: sourceId,
          targetStockId: targetId,
          relationTypeId: row.relationTypeId,
          productId,
          revenueDependencyPct: row.dependency ? Number(row.dependency) : null,
          weight: 1,
          description: row.description || null,
          lastConfirmedAt: new Date().toISOString().slice(0, 10),
        });
        anySucceeded = true;
      } catch (err) {
        remaining.push({ ...row, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (anySucceeded) {
      invalidateGraph();
      qc.invalidateQueries({ queryKey: ["stockRelations", anchorId] });
    }

    setSubmitting(false);

    if (remaining.length === 0) {
      onClose();
    } else {
      setRows(remaining);
      setFormError(`${rows.length - remaining.length}건 추가됨, ${remaining.length}건 실패 — 아래에서 확인 후 다시 시도하세요.`);
    }
  }

  return (
    <Modal title="공급망 관계 일괄 추가" onClose={onClose}>
      <form onSubmit={handleSubmit} className="entity-form">
        <label>
          기준 종목
          <input value={anchorNode ? `${anchorNode.name} (${anchorNode.ticker})` : ""} disabled />
        </label>

        <div className="relation-row-list">
          {rows.map((row) => (
            <RelationRowFields
              key={row.key}
              row={row}
              anchorId={anchorId}
              payload={payload}
              onUpdate={(patch) => updateRow(row.key, patch)}
              onRemove={rows.length > 1 ? () => removeRow(row.key) : undefined}
            />
          ))}
        </div>

        <button type="button" className="secondary-button" onClick={addRow}>+ 공급사/고객사 행 추가</button>

        {formError && <span className="form-error">{formError}</span>}
        <button type="submit" disabled={submitting} className="primary-button">
          {rows.length > 1 ? `${rows.length}건 한꺼번에 추가` : "추가"}
        </button>
      </form>
    </Modal>
  );
}

interface RelationRowFieldsProps {
  row: RelationRow;
  anchorId: number | undefined;
  payload: GraphPayload;
  onUpdate: (patch: Partial<RelationRow>) => void;
  onRemove?: () => void;
}

function RelationRowFields({ row, anchorId, payload, onUpdate, onRemove }: RelationRowFieldsProps) {
  const { data: anchorProducts = [] } = useStockProductsQuery(anchorId ?? null);
  const { data: counterpartProducts = [] } = useStockProductsQuery(row.counterpartId ?? null);
  const productOptions = useMemo(() => {
    const merged = new Map<number, string>();
    for (const p of [...anchorProducts, ...counterpartProducts]) {
      if (p.productName) merged.set(p.productId, p.productName);
    }
    return Array.from(merged, ([id, label]) => ({ id, label }));
  }, [anchorProducts, counterpartProducts]);

  return (
    <div className="relation-row">
      <label>
        관계 방향
        <select value={row.direction} onChange={(e) => onUpdate({ direction: e.target.value as Direction })}>
          <option value="counterpartIsSource">상대방이 공급사 (상대 → 기준 종목)</option>
          <option value="counterpartIsTarget">상대방이 고객사 (기준 종목 → 상대)</option>
        </select>
      </label>
      <label>
        상대 종목
        <StockPicker
          id={`rel-counterpart-${row.key}`}
          nodes={payload.nodes}
          value={row.counterpartId}
          onChange={(id) => onUpdate({ counterpartId: id })}
          excludeId={anchorId}
        />
      </label>
      <label>
        관계유형
        <select
          value={row.relationTypeId}
          onChange={(e) => onUpdate({ relationTypeId: Number(e.target.value) })}
        >
          {payload.relationTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>{rt.labelKo}</option>
          ))}
        </select>
      </label>
      <label>
        거래 품목 (선택, 대표 품목 1개)
        <Combobox
          id={`relation-product-${row.key}`}
          options={productOptions}
          value={row.productText}
          onInputChange={(text) => onUpdate({ productText: text })}
          onSelect={(option) => onUpdate({ productText: option.label })}
          placeholder={
            productOptions.length > 0
              ? "품목명 입력 (두 종목의 등록된 품목 중 선택, 새 품목은 자동 등록)"
              : "품목명 입력 (등록된 관련 품목 없음, 새로 입력 시 자동 등록)"
          }
        />
      </label>
      <label>
        매출 의존도 (%, 모르면 비워두세요)
        <input
          type="number"
          step="0.1"
          value={row.dependency}
          onChange={(e) => onUpdate({ dependency: e.target.value })}
        />
      </label>
      <label>
        비고
        <textarea value={row.description} onChange={(e) => onUpdate({ description: e.target.value })} />
      </label>
      {row.error && <span className="form-error">{row.error}</span>}
      {onRemove && (
        <button type="button" className="link-button" onClick={onRemove}>
          이 행 삭제
        </button>
      )}
    </div>
  );
}
