import { db } from "../db/connection.js";
import type { LayoutPosition } from "@valuechain/shared";

/** Assigns a cheap circular placement to any stock lacking cached coordinates,
 * so /api/graph never has to wait on a force-layout computation. */
export function ensureLayoutForAllNodes(): void {
  const rows = db
    .prepare("SELECT id FROM stocks WHERE pos_x IS NULL OR pos_y IS NULL ORDER BY id")
    .all() as { id: number }[];
  if (rows.length === 0) return;

  const totalRow = db.prepare("SELECT COUNT(*) as c FROM stocks").get() as { c: number };
  const total = totalRow.c || 1;
  const radius = Math.max(200, Math.sqrt(total) * 60);

  const update = db.prepare("UPDATE stocks SET pos_x = ?, pos_y = ? WHERE id = ?");
  const tx = db.transaction((items: { id: number }[]) => {
    items.forEach((row, idx) => {
      const angle = (2 * Math.PI * idx) / items.length;
      update.run(radius * Math.cos(angle), radius * Math.sin(angle), row.id);
    });
  });
  tx(rows);
}

/** Bulk upsert of client-computed ForceAtlas2 coordinates in a single transaction. */
export function upsertLayoutPositions(positions: LayoutPosition[]): void {
  const update = db.prepare(
    "UPDATE stocks SET pos_x = @x, pos_y = @y WHERE id = @stockId AND layout_pinned = 0",
  );
  const tx = db.transaction((items: LayoutPosition[]) => {
    for (const p of items) update.run(p);
    db.prepare(
      `INSERT INTO layout_meta (id, algorithm, last_computed_at) VALUES (1, 'forceatlas2', datetime('now'))
       ON CONFLICT(id) DO UPDATE SET algorithm = excluded.algorithm, last_computed_at = excluded.last_computed_at`,
    ).run();
  });
  tx(positions);
}

/** O(1) placement for a newly added stock: average of its already-positioned neighbors. */
export function placeNearNeighbors(stockId: number): void {
  const neighbors = db
    .prepare(
      `SELECT s.pos_x as pos_x, s.pos_y as pos_y FROM relations r
       JOIN stocks s ON s.id = CASE WHEN r.source_stock_id = @id THEN r.target_stock_id ELSE r.source_stock_id END
       WHERE (r.source_stock_id = @id OR r.target_stock_id = @id) AND s.pos_x IS NOT NULL`,
    )
    .all({ id: stockId }) as { pos_x: number; pos_y: number }[];

  if (neighbors.length === 0) return;

  const avgX = neighbors.reduce((sum, n) => sum + n.pos_x, 0) / neighbors.length;
  const avgY = neighbors.reduce((sum, n) => sum + n.pos_y, 0) / neighbors.length;
  const jitter = 40;
  db.prepare("UPDATE stocks SET pos_x = ?, pos_y = ? WHERE id = ? AND layout_pinned = 0").run(
    avgX + (Math.random() - 0.5) * jitter,
    avgY + (Math.random() - 0.5) * jitter,
    stockId,
  );
}

export function getLayoutMeta() {
  return db.prepare("SELECT * FROM layout_meta WHERE id = 1").get() as
    | { algorithm: string; last_computed_at: string }
    | undefined;
}
