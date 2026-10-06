import { Router } from "express";
import { buildGraphPayload } from "../services/graphService.js";

export const graphRouter = Router();

graphRouter.get("/", async (_req, res) => {
  res.json(await buildGraphPayload());
});
