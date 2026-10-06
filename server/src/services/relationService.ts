import { supabase } from "../db/supabaseClient.js";
import type { Relation, RelationInput, RelationTypeDef } from "@valuechain/shared";
import { HttpError } from "../middleware/errorHandler.js";

interface RelationRow {
  id: number;
  source_stock_id: number;
  target_stock_id: number;
  relation_type_id: number;
  product_id: number | null;
  revenue_dependency_pct: number | null;
  weight: number;
  description: string | null;
  last_confirmed_at: string | null;
}

function toRelation(row: RelationRow): Relation {
  return {
    id: row.id,
    sourceStockId: row.source_stock_id,
    targetStockId: row.target_stock_id,
    relationTypeId: row.relation_type_id,
    productId: row.product_id,
    revenueDependencyPct: row.revenue_dependency_pct,
    weight: row.weight,
    description: row.description,
    lastConfirmedAt: row.last_confirmed_at,
  };
}

export async function listRelations(params: { stockId?: number; relationTypeId?: number; productId?: number }): Promise<Relation[]> {
  let q = supabase.from("relations").select("*");

  if (params.stockId) {
    q = q.or(`source_stock_id.eq.${params.stockId},target_stock_id.eq.${params.stockId}`);
  }
  if (params.relationTypeId) q = q.eq("relation_type_id", params.relationTypeId);
  if (params.productId) q = q.eq("product_id", params.productId);

  const { data, error } = await q;
  if (error) throw new HttpError(500, error.message);
  return (data as RelationRow[]).map(toRelation);
}

export async function getRelation(id: number): Promise<Relation> {
  const { data, error } = await supabase.from("relations").select("*").eq("id", id).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, "relation not found");
  return toRelation(data as RelationRow);
}

export async function createRelation(input: RelationInput): Promise<Relation> {
  if (input.sourceStockId === input.targetStockId) {
    throw new HttpError(400, "source and target must differ");
  }
  const { data, error } = await supabase
    .from("relations")
    .insert({
      source_stock_id: input.sourceStockId,
      target_stock_id: input.targetStockId,
      relation_type_id: input.relationTypeId,
      product_id: input.productId ?? null,
      revenue_dependency_pct: input.revenueDependencyPct ?? null,
      weight: input.weight ?? 1,
      description: input.description ?? null,
      last_confirmed_at: input.lastConfirmedAt ?? null,
    })
    .select()
    .single();
  if (error) throw new HttpError(error.code === "23505" ? 409 : 500, error.message);
  return toRelation(data as RelationRow);
}

export async function updateRelation(id: number, input: Partial<RelationInput>): Promise<Relation> {
  const existing = await getRelation(id);
  const merged = { ...existing, ...input };
  const { data, error } = await supabase
    .from("relations")
    .update({
      source_stock_id: merged.sourceStockId,
      target_stock_id: merged.targetStockId,
      relation_type_id: merged.relationTypeId,
      product_id: merged.productId ?? null,
      revenue_dependency_pct: merged.revenueDependencyPct ?? null,
      weight: merged.weight,
      description: merged.description ?? null,
      last_confirmed_at: merged.lastConfirmedAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new HttpError(500, error.message);
  return toRelation(data as RelationRow);
}

export async function deleteRelation(id: number): Promise<void> {
  const { error } = await supabase.from("relations").delete().eq("id", id);
  if (error) throw new HttpError(500, error.message);
}

interface RelationTypeRow {
  id: number;
  code: string;
  label_ko: string;
  color: string;
  directionality: "directed" | "undirected";
}

function toRelationType(row: RelationTypeRow): RelationTypeDef {
  return { id: row.id, code: row.code, labelKo: row.label_ko, color: row.color, directionality: row.directionality };
}

export async function listRelationTypes(): Promise<RelationTypeDef[]> {
  const { data, error } = await supabase.from("relation_types").select("*").order("id");
  if (error) throw new HttpError(500, error.message);
  return (data as RelationTypeRow[]).map(toRelationType);
}

export async function createRelationType(input: { code: string; labelKo: string; color: string; directionality: "directed" | "undirected" }): Promise<RelationTypeDef> {
  const { data, error } = await supabase
    .from("relation_types")
    .insert({ code: input.code, label_ko: input.labelKo, color: input.color, directionality: input.directionality })
    .select()
    .single();
  if (error) throw new HttpError(error.code === "23505" ? 409 : 500, error.message);
  return toRelationType(data as RelationTypeRow);
}
