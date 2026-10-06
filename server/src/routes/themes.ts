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

themesRouter.get("/", async (_req, res) => {
  res.json(await listThemes());
});

themesRouter.post("/", async (req, res) => {
  const input = ThemeInputSchema.parse(req.body);
  res.status(201).json(await createTheme(input));
});

export const stockThemesRouter = Router({ mergeParams: true });

stockThemesRouter.get("/", async (req, res) => {
  res.json(await listStockThemeIds(paramNumber(req, "id")));
});

stockThemesRouter.post("/", async (req, res) => {
  const { themeId } = z.object({ themeId: z.number().int() }).parse(req.body);
  await addStockTheme(paramNumber(req, "id"), themeId);
  res.status(201).json(await listStockThemeIds(paramNumber(req, "id")));
});

stockThemesRouter.delete("/:themeId", async (req, res) => {
  await removeStockTheme(paramNumber(req, "id"), paramNumber(req, "themeId"));
  res.status(204).end();
});
