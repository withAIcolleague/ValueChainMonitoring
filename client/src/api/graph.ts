import type { GraphPayload, LayoutPosition } from "@valuechain/shared";
import { api } from "./client";

export function fetchGraph() {
  return api.get<GraphPayload>("/graph");
}

export function saveLayoutPositions(positions: LayoutPosition[]) {
  return api.put<{ updated: number }>("/layout/positions", positions);
}
