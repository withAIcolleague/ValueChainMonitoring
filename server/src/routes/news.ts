import { Router } from "express";
import { NewsCategory, NewsInputSchema } from "@valuechain/shared";
import { z } from "zod";
import {
  addManualNews,
  deleteNews,
  listNews,
  updateNews,
} from "../services/newsService.js";
import { fetchGoogleNewsForStock } from "../news/googleNewsFetcher.js";
import { db } from "../db/connection.js";
import { paramNumber } from "../middleware/validate.js";

export const newsRouter = Router();

newsRouter.get("/", (req, res) => {
  const { stockId, category, from, to } = req.query;
  res.json(
    listNews({
      stockId: stockId ? Number(stockId) : undefined,
      category: typeof category === "string" ? (category as any) : undefined,
      from: typeof from === "string" ? from : undefined,
      to: typeof to === "string" ? to : undefined,
    }),
  );
});

newsRouter.put("/:id", (req, res) => {
  const input = z.object({ category: NewsCategory.optional(), isConfirmed: z.boolean().optional() }).parse(req.body);
  res.json(updateNews(Number(req.params.id), input));
});

newsRouter.delete("/:id", (req, res) => {
  deleteNews(Number(req.params.id));
  res.status(204).end();
});

newsRouter.post("/fetch/:stockId", async (req, res) => {
  const stockId = Number(req.params.stockId);
  const stock = db.prepare("SELECT name FROM stocks WHERE id = ?").get(stockId) as { name: string } | undefined;
  if (!stock) {
    res.status(404).json({ error: "stock not found" });
    return;
  }
  const inserted = await fetchGoogleNewsForStock(stockId, stock.name);
  res.json({ stockId, inserted });
});

export const manualNewsRouter = Router({ mergeParams: true });

manualNewsRouter.post("/", (req, res) => {
  const input = NewsInputSchema.parse(req.body);
  res.status(201).json(addManualNews(paramNumber(req, "id"), input));
});
