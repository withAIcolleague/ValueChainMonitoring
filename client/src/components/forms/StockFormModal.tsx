import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StockInputSchema, type GraphNode, type Stock, type StockInput } from "@valuechain/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createStock, updateStock } from "../../api/stocks";
import { useInvalidateGraph } from "../../hooks/queries";
import { Modal } from "./Modal";
import { findSimilarStocks } from "../../utils/similarity";

interface StockFormModalProps {
  stock?: Stock;
  existingNodes: GraphNode[];
  onClose: () => void;
  onCreated?: (stock: Stock) => void;
}

export function StockFormModal({ stock, existingNodes, onClose, onCreated }: StockFormModalProps) {
  const qc = useQueryClient();
  const invalidateGraph = useInvalidateGraph();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StockInput>({
    resolver: zodResolver(StockInputSchema),
    defaultValues: stock ?? { ticker: "", name: "", sector: "", market: "" },
  });

  const nameValue = watch("name");
  const similarStocks = findSimilarStocks(nameValue ?? "", existingNodes, stock?.id);

  async function onSubmit(data: StockInput) {
    const result = stock ? await updateStock(stock.id, data) : await createStock(data);
    invalidateGraph();
    if (stock) qc.invalidateQueries({ queryKey: ["stock", stock.id] });
    onCreated?.(result);
    onClose();
  }

  return (
    <Modal title={stock ? "종목 수정" : "종목 추가"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="entity-form">
        <label>
          티커
          <input {...register("ticker")} onChange={(e) => (e.target.value = e.target.value.toUpperCase())} />
          {errors.ticker && <span className="form-error">{errors.ticker.message}</span>}
        </label>
        <label>
          기업명
          <input {...register("name")} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </label>
        {similarStocks.length > 0 && (
          <div className="similar-stock-warning">
            비슷한 이름의 기존 종목이 있습니다. 같은 회사라면 새로 추가하지 말고 기존 종목을 이용하세요.
            <ul>
              {similarStocks.map((m) => (
                <li key={m.node.id}>
                  {m.node.name} ({m.node.ticker})
                </li>
              ))}
            </ul>
          </div>
        )}
        <label>
          섹터
          <input {...register("sector")} />
        </label>
        <label>
          시장
          <input {...register("market")} list="market-options" placeholder="KOSPI, NASDAQ, TSE 등 (목록에 없으면 직접 입력)" />
          <datalist id="market-options">
            <option value="KOSPI" />
            <option value="KOSDAQ" />
            <option value="KONEX" />
            <option value="NYSE" />
            <option value="NASDAQ" />
            <option value="AMEX" />
            <option value="TSE" />
            <option value="SSE" />
            <option value="SZSE" />
            <option value="HKEX" />
            <option value="LSE" />
          </datalist>
        </label>
        <label>
          시가총액 (원)
          <input type="number" {...register("marketCap", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
        </label>
        <label>
          주요사업 개요
          <textarea {...register("businessSummary")} />
        </label>
        <label>
          투자 리스크 메모
          <textarea {...register("riskNotes")} />
        </label>
        <button type="submit" disabled={isSubmitting} className="primary-button">
          {stock ? "수정 저장" : "추가"}
        </button>
      </form>
    </Modal>
  );
}
