import { Router } from "express";
import { ProductInputSchema, StockProductInputSchema } from "@valuechain/shared";
import {
  addStockProduct,
  createProduct,
  listProducts,
  listStockProducts,
  removeStockProduct,
} from "../services/productService.js";
import { paramNumber } from "../middleware/validate.js";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res) => {
  res.json(await listProducts());
});

productsRouter.post("/", async (req, res) => {
  const input = ProductInputSchema.parse(req.body);
  res.status(201).json(await createProduct(input));
});

export const stockProductsRouter = Router({ mergeParams: true });

stockProductsRouter.get("/", async (req, res) => {
  res.json(await listStockProducts(paramNumber(req, "id")));
});

stockProductsRouter.post("/", async (req, res) => {
  const input = StockProductInputSchema.parse(req.body);
  res.status(201).json(await addStockProduct(paramNumber(req, "id"), input));
});

stockProductsRouter.delete("/:productId/:businessType", async (req, res) => {
  await removeStockProduct(paramNumber(req, "id"), paramNumber(req, "productId"), req.params.businessType);
  res.status(204).end();
});
