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
import { getStock } from "../services/stockService.js";
import { paramNumber } from "../middleware/validate.js";

export const newsRouter = Router();

newsRouter.get("/", async (req, res) => {
  const { stockId, category, from, to } = req.query;
  const news = await listNews({
    stockId: stockId ? Number(stockId) : undefined,
    category: typeof category === "string" ? (category as any) : undefined,
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
  });
  res.json(news);
});

newsRouter.put("/:id", async (req, res) => {
  const input = z.object({ category: NewsCategory.optional(), isConfirmed: z.boolean().optional() }).parse(req.body);
  res.json(await updateNews(Number(req.params.id), input));
});

newsRouter.delete("/:id", async (req, res) => {
  await deleteNews(Number(req.params.id));
  res.status(204).end();
});

newsRouter.post("/fetch/:stockId", async (req, res) => {
  const stockId = Number(req.params.stockId);
  const stock = await getStock(stockId);
  const inserted = await fetchGoogleNewsForStock(stockId, stock.name);
  res.json({ stockId, inserted });
});

export const manualNewsRouter = Router({ mergeParams: true });

manualNewsRouter.post("/", async (req, res) => {
  const input = NewsInputSchema.parse(req.body);
  res.status(201).json(await addManualNews(paramNumber(req, "id"), input));
});
