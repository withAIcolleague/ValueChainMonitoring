import { Router } from "express";
import { StockLinkInputSchema } from "@valuechain/shared";
import { addStockLink, listStockLinks, removeStockLink } from "../services/linkService.js";
import { paramNumber } from "../middleware/validate.js";

export const stockLinksRouter = Router({ mergeParams: true });

stockLinksRouter.get("/", async (req, res) => {
  res.json(await listStockLinks(paramNumber(req, "id")));
});

stockLinksRouter.post("/", async (req, res) => {
  const input = StockLinkInputSchema.parse(req.body);
  res.status(201).json(await addStockLink(paramNumber(req, "id"), input));
});

stockLinksRouter.delete("/:linkId", async (req, res) => {
  await removeStockLink(paramNumber(req, "id"), paramNumber(req, "linkId"));
  res.status(204).end();
});
