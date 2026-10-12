import type { GraphNode } from "@valuechain/shared";

const CORP_SUFFIXES = ["주식회사", "㈜", "(주)", "㈜)", "(유)", "유한회사", "co.,ltd", "co.ltd", "corp.", "corp", "inc."];

export function normalizeCompanyName(raw: string): string {
  let s = raw.toLowerCase().trim();
  for (const suffix of CORP_SUFFIXES) {
    s = s.split(suffix).join("");
  }
  s = s.replace(/[\s.,()·\-_]/g, "");
  return s;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * Typo-tolerant substring match for live search-as-you-type: exact substring match first
 * (cheap, precise), then falls back to checking whether any similarly-sized window of
 * `haystack` is within a small edit distance of `needle`, so a misspelled query (e.g.
 * "삼송전자" for "삼성전자") still finds the intended result.
 */
export function fuzzyIncludes(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  if (h.includes(n)) return true;
  if (n.length < 2) return false;

  const maxDistance = n.length <= 3 ? 1 : Math.floor(n.length * 0.3);
  const windowLens = new Set([n.length - 1, n.length, n.length + 1].filter((len) => len > 0));
  for (const len of windowLens) {
    for (let i = 0; i + len <= h.length; i++) {
      if (levenshtein(h.slice(i, i + len), n) <= maxDistance) return true;
    }
  }
  return false;
}

export interface SimilarStockMatch {
  node: GraphNode;
  reason: "exact" | "contains" | "fuzzy";
}

/**
 * Finds existing stocks whose name closely resembles `rawName`, so the add-stock
 * form can warn before creating a duplicate node for a company that already exists
 * under a slightly different spelling (the `name` column has no UNIQUE constraint).
 */
export function findSimilarStocks(
  rawName: string,
  nodes: GraphNode[],
  excludeId?: number,
): SimilarStockMatch[] {
  const query = normalizeCompanyName(rawName);
  if (query.length < 2) return [];

  const matches: SimilarStockMatch[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    const candidate = normalizeCompanyName(node.name);
    if (!candidate) continue;

    if (candidate === query) {
      matches.push({ node, reason: "exact" });
      continue;
    }
    if (candidate.length >= 3 && (candidate.includes(query) || query.includes(candidate))) {
      matches.push({ node, reason: "contains" });
      continue;
    }
    const maxLen = Math.max(candidate.length, query.length);
    const distance = levenshtein(candidate, query);
    if (maxLen >= 3 && distance <= Math.max(1, Math.floor(maxLen * 0.2))) {
      matches.push({ node, reason: "fuzzy" });
    }
  }

  return matches.sort((a, b) => (a.reason === "exact" ? -1 : 0) - (b.reason === "exact" ? -1 : 0));
}
