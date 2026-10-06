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

stocksRouter.get("/", (req, res) => {
  const { query, sector, market, limit, offset } = req.query;
  const stocks = listStocks({
    query: typeof query === "string" ? query : undefined,
    sector: typeof sector === "string" ? sector : undefined,
    market: typeof market === "string" ? market : undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  res.json(stocks);
});

stocksRouter.get("/:id", (req, res) => {
  const stock = getStock(Number(req.params.id));
  const stats = getStockStats(Number(req.params.id));
  res.json({ ...stock, ...stats });
});

stocksRouter.post("/", (req, res) => {
  const input = StockInputSchema.parse(req.body);
  const stock = createStock(input);
  placeNearNeighbors(stock.id);
  res.status(201).json(stock);
});

stocksRouter.put("/:id", (req, res) => {
  const input = StockInputSchema.partial().parse(req.body);
  const stock = updateStock(Number(req.params.id), input);
  res.json(stock);
});

stocksRouter.delete("/:id", (req, res) => {
  deleteStock(Number(req.params.id));
  res.status(204).end();
});
