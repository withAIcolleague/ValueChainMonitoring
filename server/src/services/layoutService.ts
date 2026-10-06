import { supabase } from "../db/supabaseClient.js";
import type { LayoutPosition } from "@valuechain/shared";
import { HttpError } from "../middleware/errorHandler.js";

/** Assigns a cheap circular placement to any stock lacking cached coordinates,
 * so /api/graph never has to wait on a force-layout computation. */
export async function ensureLayoutForAllNodes(): Promise<void> {
  const { data: rows, error } = await supabase
    .from("stocks")
    .select("id")
    .or("pos_x.is.null,pos_y.is.null")
    .order("id");
  if (error) throw new HttpError(500, error.message);
  if (!rows || rows.length === 0) return;

  const { count, error: countError } = await supabase
    .from("stocks")
    .select("*", { count: "exact", head: true });
  if (countError) throw new HttpError(500, countError.message);

  const total = count || 1;
  const radius = Math.max(200, Math.sqrt(total) * 60);

  const updates = rows.map((row: { id: number }, idx: number) => {
    const angle = (2 * Math.PI * idx) / rows.length;
    return { id: row.id, x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });

  const { error: rpcError } = await supabase.schema("valuechain").rpc("bulk_update_positions", { updates });
  if (rpcError) throw new HttpError(500, rpcError.message);
}

/** Bulk-saves client-computed ForceAtlas2 coordinates via a Postgres function rather than
 * upsert: upsert's generated INSERT branch would fail Postgres's NOT NULL checks on columns
 * (ticker, name, ...) that a position-only payload never provides, even though the row always
 * exists and only the UPDATE branch ever actually runs. A plain SQL UPDATE has no such
 * constraint and also lets `layout_pinned` be enforced server-side instead of via a pre-filter. */
export async function upsertLayoutPositions(positions: LayoutPosition[]): Promise<number> {
  if (positions.length === 0) return 0;

  const { error } = await supabase.schema("valuechain").rpc("bulk_update_positions", {
    updates: positions.map((p) => ({ id: p.stockId, x: p.x, y: p.y })),
  });
  if (error) throw new HttpError(500, error.message);

  const { error: metaError } = await supabase
    .from("layout_meta")
    .upsert({ id: 1, algorithm: "forceatlas2", last_computed_at: new Date().toISOString() }, { onConflict: "id" });
  if (metaError) throw new HttpError(500, metaError.message);

  return positions.length;
}

/** O(1) placement for a newly added stock: average of its already-positioned neighbors. */
export async function placeNearNeighbors(stockId: number): Promise<void> {
  const { data: relRows, error: relError } = await supabase
    .from("relations")
    .select("source_stock_id, target_stock_id")
    .or(`source_stock_id.eq.${stockId},target_stock_id.eq.${stockId}`);
  if (relError) throw new HttpError(500, relError.message);
  if (!relRows || relRows.length === 0) return;

  const neighborIds = Array.from(
    new Set(
      relRows.map((r: { source_stock_id: number; target_stock_id: number }) =>
        r.source_stock_id === stockId ? r.target_stock_id : r.source_stock_id,
      ),
    ),
  );
  if (neighborIds.length === 0) return;

  const { data: neighborStocks, error: stockError } = await supabase
    .from("stocks")
    .select("pos_x, pos_y")
    .in("id", neighborIds)
    .not("pos_x", "is", null);
  if (stockError) throw new HttpError(500, stockError.message);
  if (!neighborStocks || neighborStocks.length === 0) return;

  const avgX = neighborStocks.reduce((sum: number, n: { pos_x: number }) => sum + n.pos_x, 0) / neighborStocks.length;
  const avgY = neighborStocks.reduce((sum: number, n: { pos_y: number }) => sum + n.pos_y, 0) / neighborStocks.length;
  const jitter = 40;

  const { error: updateError } = await supabase
    .from("stocks")
    .update({
      pos_x: avgX + (Math.random() - 0.5) * jitter,
      pos_y: avgY + (Math.random() - 0.5) * jitter,
    })
    .eq("id", stockId)
    .eq("layout_pinned", 0);
  if (updateError) throw new HttpError(500, updateError.message);
}

export async function getLayoutMeta(): Promise<{ algorithm: string; last_computed_at: string } | undefined> {
  const { data, error } = await supabase.from("layout_meta").select("*").eq("id", 1).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  return data ?? undefined;
}
