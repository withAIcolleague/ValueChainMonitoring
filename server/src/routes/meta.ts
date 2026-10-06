import { Router } from "express";
import { db } from "../db/connection.js";
import { getLayoutMeta } from "../services/layoutService.js";

export const metaRouter = Router();

metaRouter.get("/stats", (_req, res) => {
  const stockCount = (db.prepare("SELECT COUNT(*) as c FROM stocks").get() as { c: number }).c;
  const relationCount = (db.prepare("SELECT COUNT(*) as c FROM relations").get() as { c: number }).c;
  const newsCount = (db.prepare("SELECT COUNT(*) as c FROM news").get() as { c: number }).c;
  res.json({ stockCount, relationCount, newsCount, layout: getLayoutMeta() ?? null });
});
