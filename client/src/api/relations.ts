import type { Relation, RelationInput, RelationTypeDef } from "@valuechain/shared";
import { api } from "./client";

export function fetchRelationTypes() {
  return api.get<RelationTypeDef[]>("/relation-types");
}

export function fetchRelations(params: { stockId?: number } = {}) {
  const qs = params.stockId ? `?stockId=${params.stockId}` : "";
  return api.get<Relation[]>(`/relations${qs}`);
}

export function createRelation(input: RelationInput) {
  return api.post<Relation>("/relations", input);
}

export function updateRelation(id: number, input: Partial<RelationInput>) {
  return api.put<Relation>(`/relations/${id}`, input);
}

export function deleteRelation(id: number) {
  return api.delete<void>(`/relations/${id}`);
}
