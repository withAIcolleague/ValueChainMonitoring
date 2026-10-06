import type { News, NewsCategory } from "@valuechain/shared";
import { deleteNews, fetchNewsForStock, updateNews } from "../../api/news";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  CONTRACT: "계약",
  CANCELLATION: "취소",
  ACHIEVEMENT: "성공",
  EARNINGS: "실적",
  OTHER: "기타",
};

interface NewsTimelineProps {
  stockId: number;
  news: News[];
}

export function NewsTimeline({ stockId, news }: NewsTimelineProps) {
  const qc = useQueryClient();

  async function handleRefresh() {
    await fetchNewsForStock(stockId);
    qc.invalidateQueries({ queryKey: ["stockNews", stockId] });
  }

  async function handleCategoryChange(id: number, category: NewsCategory) {
    await updateNews(id, { category, isConfirmed: true });
    qc.invalidateQueries({ queryKey: ["stockNews", stockId] });
  }

  async function handleDelete(id: number) {
    await deleteNews(id);
    qc.invalidateQueries({ queryKey: ["stockNews", stockId] });
  }

  return (
    <div className="news-timeline">
      <button className="secondary-button" onClick={handleRefresh}>뉴스 새로고침</button>
      {news.length === 0 && <p className="empty-hint">수집된 뉴스가 없습니다.</p>}
      <ul>
        {news.map((n) => (
          <li key={n.id} className={n.isConfirmed ? "confirmed" : "unconfirmed"}>
            <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
            <div className="news-meta">
              <select value={n.category} onChange={(e) => handleCategoryChange(n.id, e.target.value as NewsCategory)}>
                {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <span className="news-date">{n.publishedAt?.slice(0, 10) ?? ""}</span>
              <button className="link-button" onClick={() => handleDelete(n.id)}>삭제</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
