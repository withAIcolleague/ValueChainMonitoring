import { Router } from "express";
import { ThemeInputSchema } from "@valuechain/shared";
import { z } from "zod";
import {
  addStockTheme,
  createTheme,
  listStockThemeIds,
  listThemes,
  removeStockTheme,
} from "../services/themeService.js";
import { paramNumber } from "../middleware/validate.js";

export const themesRouter = Router();

themesRouter.get("/", (_req, res) => {
  res.json(listThemes());
});

themesRouter.post("/", (req, res) => {
  const input = ThemeInputSchema.parse(req.body);
  res.status(201).json(createTheme(input));
});

export const stockThemesRouter = Router({ mergeParams: true });

stockThemesRouter.get("/", (req, res) => {
  res.json(listStockThemeIds(paramNumber(req, "id")));
});

stockThemesRouter.post("/", (req, res) => {
  const { themeId } = z.object({ themeId: z.number().int() }).parse(req.body);
  addStockTheme(paramNumber(req, "id"), themeId);
  res.status(201).json(listStockThemeIds(paramNumber(req, "id")));
});

stockThemesRouter.delete("/:themeId", (req, res) => {
  removeStockTheme(paramNumber(req, "id"), paramNumber(req, "themeId"));
  res.status(204).end();
});
