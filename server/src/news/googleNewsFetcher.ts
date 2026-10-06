import Parser from "rss-parser";
import { classifyNews } from "./newsClassifier.js";
import { upsertAutoNews } from "../services/newsService.js";

const parser = new Parser();

export interface FetchedNewsItem {
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
}

function buildFeedUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;
}

export async function fetchGoogleNewsForStock(stockId: number, queryText: string): Promise<number> {
  const feedUrl = buildFeedUrl(queryText);
  const feed = await parser.parseURL(feedUrl);

  let inserted = 0;
  for (const item of feed.items ?? []) {
    if (!item.title || !item.link) continue;
    const category = classifyNews(item.title, item.contentSnippet);
    upsertAutoNews(stockId, {
      title: item.title,
      url: item.link,
      source: item.creator ?? null,
      publishedAt: item.isoDate ?? item.pubDate ?? null,
      category,
    });
    inserted += 1;
  }
  return inserted;
}
