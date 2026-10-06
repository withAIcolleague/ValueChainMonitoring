import type { GraphNode, NewsCategory } from "@valuechain/shared";

export const NEWS_BORDER_COLOR: Record<NewsCategory, string | null> = {
  CONTRACT: "#2563eb",
  CANCELLATION: "#dc2626",
  ACHIEVEMENT: "#16a34a",
  EARNINGS: "#9333ea",
  OTHER: null,
};

export const DEFAULT_NODE_COLOR = "#94a3b8";
export const UPSTREAM_COLOR = "#2563eb";
export const DOWNSTREAM_COLOR = "#ea580c";
export const SELECTED_COLOR = "#facc15";
export const FADED_COLOR = "#e2e8f0";

const MIN_NODE_SIZE = 3;
const MAX_NODE_SIZE = 16;

export function nodeSizeFromDegree(degree: number, maxDegree: number): number {
  if (maxDegree <= 0) return MIN_NODE_SIZE;
  const ratio = Math.sqrt(degree / maxDegree);
  return MIN_NODE_SIZE + ratio * (MAX_NODE_SIZE - MIN_NODE_SIZE);
}

export function computeMaxDegree(nodes: GraphNode[]): number {
  return nodes.reduce((max, n) => Math.max(max, n.degree), 1);
}
