import { Router } from "express";
import { supabase } from "../db/supabaseClient.js";
import { getLayoutMeta } from "../services/layoutService.js";
import { HttpError } from "../middleware/errorHandler.js";

export const metaRouter = Router();

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw new HttpError(500, error.message);
  return count ?? 0;
}

metaRouter.get("/stats", async (_req, res) => {
  const [stockCount, relationCount, newsCount, layout] = await Promise.all([
    countRows("stocks"),
    countRows("relations"),
    countRows("news"),
    getLayoutMeta(),
  ]);
  res.json({ stockCount, relationCount, newsCount, layout: layout ?? null });
});
