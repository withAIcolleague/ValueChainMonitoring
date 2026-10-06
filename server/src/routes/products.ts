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

productsRouter.get("/", (_req, res) => {
  res.json(listProducts());
});

productsRouter.post("/", (req, res) => {
  const input = ProductInputSchema.parse(req.body);
  res.status(201).json(createProduct(input));
});

export const stockProductsRouter = Router({ mergeParams: true });

stockProductsRouter.get("/", (req, res) => {
  res.json(listStockProducts(paramNumber(req, "id")));
});

stockProductsRouter.post("/", (req, res) => {
  const input = StockProductInputSchema.parse(req.body);
  res.status(201).json(addStockProduct(paramNumber(req, "id"), input));
});

stockProductsRouter.delete("/:productId/:businessType", (req, res) => {
  removeStockProduct(paramNumber(req, "id"), paramNumber(req, "productId"), req.params.businessType);
  res.status(204).end();
});
