import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GraphPayload, NewsCategory } from "@valuechain/shared";
import { useAllNewsQuery } from "../../hooks/queries";
import { fetchNewsForStock } from "../../api/news";

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  CONTRACT: "계약",
  CANCELLATION: "취소",
  ACHIEVEMENT: "성공",
  EARNINGS: "실적",
  OTHER: "기타",
};

const BATCH_DELAY_MS = 500;
const REFRESH_EVERY = 10;

interface NewsFeedPanelProps {
  payload: GraphPayload;
  onClose: () => void;
  onFocusStock: (id: number) => void;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function NewsFeedPanel({ payload, onClose, onFocusStock }: NewsFeedPanelProps) {
  const [category, setCategory] = useState<NewsCategory | "">("");
  const { data: news = [], isFetching } = useAllNewsQuery(category || undefined);
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelRef = useRef(false);

  const nodeById = new Map(payload.nodes.map((n) => [n.id, n]));

  // Driven client-side (one stock at a time, paced) rather than one long server
  // request: a single request looping over hundreds of stocks would run well past
  // a serverless function's execution time limit.
  async function handleRefreshAll() {
    cancelRef.current = false;
    const stocks = payload.nodes;
    setProgress({ done: 0, total: stocks.length });

    for (let i = 0; i < stocks.length; i++) {
      if (cancelRef.current) break;
      try {
        await fetchNewsForStock(stocks[i].id);
      } catch (err) {
        console.error(`news fetch failed for stock ${stocks[i].id}`, err);
      }
      setProgress({ done: i + 1, total: stocks.length });
      if ((i + 1) % REFRESH_EVERY === 0) {
        qc.invalidateQueries({ queryKey: ["allNews"] });
      }
      await sleep(BATCH_DELAY_MS);
    }

    qc.invalidateQueries({ queryKey: ["allNews"] });
    setProgress(null);
  }

  function handleCancel() {
    cancelRef.current = true;
  }

  return (
    <aside className="news-feed-panel">
      <div className="detail-panel-header">
        <h2>뉴스 피드</h2>
        <button className="link-button" onClick={onClose}>닫기</button>
      </div>
      <div className="news-feed-controls">
        <select value={category} onChange={(e) => setCategory(e.target.value as NewsCategory | "")}>
          <option value="">전체 카테고리</option>
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {progress ? (
          <>
            <span className="news-progress">{progress.done}/{progress.total} 처리 중...</span>
            <button className="secondary-button" onClick={handleCancel}>중단</button>
          </>
        ) : (
          <button className="secondary-button" onClick={handleRefreshAll}>전체 종목 새로고침</button>
        )}
      </div>
      {isFetching && <p className="empty-hint">불러오는 중...</p>}
      <ul className="news-feed-list">
        {news.map((n) => (
          <li key={n.id}>
            <button className="link-button stock-jump" onClick={() => onFocusStock(n.stockId)}>
              {nodeById.get(n.stockId)?.name ?? n.stockId}
            </button>
            <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
            <span className="badge">{CATEGORY_LABEL[n.category]}</span>
            <span className="news-date">{n.publishedAt?.slice(0, 10) ?? ""}</span>
          </li>
        ))}
        {news.length === 0 && !isFetching && <li className="empty-hint">뉴스가 없습니다.</li>}
      </ul>
    </aside>
  );
}
