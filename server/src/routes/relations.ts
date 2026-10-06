import { Router } from "express";
import { RelationInputSchema } from "@valuechain/shared";
import {
  createRelation,
  deleteRelation,
  listRelations,
  updateRelation,
} from "../services/relationService.js";
import { placeNearNeighbors } from "../services/layoutService.js";

export const relationsRouter = Router();

relationsRouter.get("/", async (req, res) => {
  const { stockId, relationTypeId, productId } = req.query;
  const relations = await listRelations({
    stockId: stockId ? Number(stockId) : undefined,
    relationTypeId: relationTypeId ? Number(relationTypeId) : undefined,
    productId: productId ? Number(productId) : undefined,
  });
  res.json(relations);
});

relationsRouter.post("/", async (req, res) => {
  const input = RelationInputSchema.parse(req.body);
  const relation = await createRelation(input);
  await Promise.all([placeNearNeighbors(relation.sourceStockId), placeNearNeighbors(relation.targetStockId)]);
  res.status(201).json(relation);
});

relationsRouter.put("/:id", async (req, res) => {
  const input = RelationInputSchema.partial().parse(req.body);
  res.json(await updateRelation(Number(req.params.id), input));
});

relationsRouter.delete("/:id", async (req, res) => {
  await deleteRelation(Number(req.params.id));
  res.status(204).end();
});
