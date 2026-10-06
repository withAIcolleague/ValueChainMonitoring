import { Router } from "express";
import { z } from "zod";
import { createRelationType, listRelationTypes } from "../services/relationService.js";

export const relationTypesRouter = Router();

const RelationTypeInputSchema = z.object({
  code: z.string().min(1),
  labelKo: z.string().min(1),
  color: z.string().min(1),
  directionality: z.enum(["directed", "undirected"]).default("directed"),
});

relationTypesRouter.get("/", (_req, res) => {
  res.json(listRelationTypes());
});

relationTypesRouter.post("/", (req, res) => {
  const input = RelationTypeInputSchema.parse(req.body);
  res.status(201).json(createRelationType(input));
});
