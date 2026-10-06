import { db } from "../db/connection.js";
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

export function listRelations(params: { stockId?: number; relationTypeId?: number; productId?: number }): Relation[] {
  const conditions: string[] = [];
  const args: Record<string, unknown> = {};

  if (params.stockId) {
    conditions.push("(source_stock_id = @stockId OR target_stock_id = @stockId)");
    args.stockId = params.stockId;
  }
  if (params.relationTypeId) {
    conditions.push("relation_type_id = @relationTypeId");
    args.relationTypeId = params.relationTypeId;
  }
  if (params.productId) {
    conditions.push("product_id = @productId");
    args.productId = params.productId;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM relations ${where}`).all(args) as RelationRow[];
  return rows.map(toRelation);
}

export function getRelation(id: number): Relation {
  const row = db.prepare("SELECT * FROM relations WHERE id = ?").get(id) as RelationRow | undefined;
  if (!row) throw new HttpError(404, "relation not found");
  return toRelation(row);
}

export function createRelation(input: RelationInput): Relation {
  if (input.sourceStockId === input.targetStockId) {
    throw new HttpError(400, "source and target must differ");
  }
  const result = db
    .prepare(
      `INSERT INTO relations
        (source_stock_id, target_stock_id, relation_type_id, product_id, revenue_dependency_pct, weight, description, last_confirmed_at)
       VALUES (@sourceStockId, @targetStockId, @relationTypeId, @productId, @revenueDependencyPct, @weight, @description, @lastConfirmedAt)`,
    )
    .run({
      sourceStockId: input.sourceStockId,
      targetStockId: input.targetStockId,
      relationTypeId: input.relationTypeId,
      productId: input.productId ?? null,
      revenueDependencyPct: input.revenueDependencyPct ?? null,
      weight: input.weight ?? 1,
      description: input.description ?? null,
      lastConfirmedAt: input.lastConfirmedAt ?? null,
    });
  return getRelation(Number(result.lastInsertRowid));
}

export function updateRelation(id: number, input: Partial<RelationInput>): Relation {
  const existing = getRelation(id);
  const merged = { ...existing, ...input };
  db.prepare(
    `UPDATE relations SET
       source_stock_id=@sourceStockId, target_stock_id=@targetStockId, relation_type_id=@relationTypeId,
       product_id=@productId, revenue_dependency_pct=@revenueDependencyPct, weight=@weight,
       description=@description, last_confirmed_at=@lastConfirmedAt, updated_at=datetime('now')
     WHERE id=@id`,
  ).run({
    id,
    sourceStockId: merged.sourceStockId,
    targetStockId: merged.targetStockId,
    relationTypeId: merged.relationTypeId,
    productId: merged.productId ?? null,
    revenueDependencyPct: merged.revenueDependencyPct ?? null,
    weight: merged.weight,
    description: merged.description ?? null,
    lastConfirmedAt: merged.lastConfirmedAt ?? null,
  });
  return getRelation(id);
}

export function deleteRelation(id: number): void {
  db.prepare("DELETE FROM relations WHERE id = ?").run(id);
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

export function listRelationTypes(): RelationTypeDef[] {
  const rows = db.prepare("SELECT * FROM relation_types ORDER BY id").all() as RelationTypeRow[];
  return rows.map(toRelationType);
}

export function createRelationType(input: { code: string; labelKo: string; color: string; directionality: "directed" | "undirected" }): RelationTypeDef {
  const result = db
    .prepare(
      "INSERT INTO relation_types (code, label_ko, color, directionality) VALUES (@code, @labelKo, @color, @directionality)",
    )
    .run(input);
  const row = db.prepare("SELECT * FROM relation_types WHERE id = ?").get(result.lastInsertRowid) as RelationTypeRow;
  return toRelationType(row);
}
