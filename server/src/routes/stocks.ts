import { Router } from "express";
import { StockInputSchema } from "@valuechain/shared";
import {
  createStock,
  deleteStock,
  getStock,
  getStockStats,
  listStocks,
  updateStock,
} from "../services/stockService.js";
import { placeNearNeighbors } from "../services/layoutService.js";

export const stocksRouter = Router();

stocksRouter.get("/", async (req, res) => {
  const { query, sector, market, limit, offset } = req.query;
  const stocks = await listStocks({
    query: typeof query === "string" ? query : undefined,
    sector: typeof sector === "string" ? sector : undefined,
    market: typeof market === "string" ? market : undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  res.json(stocks);
});

stocksRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [stock, stats] = await Promise.all([getStock(id), getStockStats(id)]);
  res.json({ ...stock, ...stats });
});

stocksRouter.post("/", async (req, res) => {
  const input = StockInputSchema.parse(req.body);
  const stock = await createStock(input);
  await placeNearNeighbors(stock.id);
  res.status(201).json(stock);
});

stocksRouter.put("/:id", async (req, res) => {
  const input = StockInputSchema.partial().parse(req.body);
  const stock = await updateStock(Number(req.params.id), input);
  res.json(stock);
});

stocksRouter.delete("/:id", async (req, res) => {
  await deleteStock(Number(req.params.id));
  res.status(204).end();
});
