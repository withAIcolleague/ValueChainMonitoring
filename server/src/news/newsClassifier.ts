import type { NewsCategory } from "@valuechain/shared";

const KEYWORD_RULES: Array<{ category: NewsCategory; keywords: string[] }> = [
  { category: "CANCELLATION", keywords: ["취소", "해지", "무산", "철회", "파기"] },
  { category: "CONTRACT", keywords: ["수주", "계약", "MOU", "체결", "공급 계약", "납품 계약"] },
  { category: "EARNINGS", keywords: ["실적", "매출", "영업이익", "적자", "흑자전환", "잠정실적"] },
  { category: "ACHIEVEMENT", keywords: ["선정", "수상", "인증", "흑자", "최대 실적", "신기록"] },
];

export function classifyNews(title: string, summary?: string): NewsCategory {
  const text = `${title} ${summary ?? ""}`;
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }
  return "OTHER";
}
