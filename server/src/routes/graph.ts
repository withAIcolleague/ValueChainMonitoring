import { Router } from "express";
import { buildGraphPayload } from "../services/graphService.js";

export const graphRouter = Router();

graphRouter.get("/", (_req, res) => {
  res.json(buildGraphPayload());
});
