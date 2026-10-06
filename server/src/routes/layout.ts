import { Router } from "express";
import { z } from "zod";
import { LayoutPositionSchema } from "@valuechain/shared";
import { getLayoutMeta, upsertLayoutPositions } from "../services/layoutService.js";

export const layoutRouter = Router();

layoutRouter.put("/positions", (req, res) => {
  const positions = z.array(LayoutPositionSchema).parse(req.body);
  upsertLayoutPositions(positions);
  res.json({ updated: positions.length });
});

layoutRouter.get("/meta", (_req, res) => {
  res.json(getLayoutMeta() ?? null);
});
