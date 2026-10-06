import { Router } from "express";
import { z } from "zod";
import { LayoutPositionSchema } from "@valuechain/shared";
import { getLayoutMeta, upsertLayoutPositions } from "../services/layoutService.js";

export const layoutRouter = Router();

layoutRouter.put("/positions", async (req, res) => {
  const positions = z.array(LayoutPositionSchema).parse(req.body);
  const updated = await upsertLayoutPositions(positions);
  res.json({ updated });
});

layoutRouter.get("/meta", async (_req, res) => {
  res.json((await getLayoutMeta()) ?? null);
});
