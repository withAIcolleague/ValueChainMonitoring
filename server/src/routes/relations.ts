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

relationsRouter.get("/", (req, res) => {
  const { stockId, relationTypeId, productId } = req.query;
  res.json(
    listRelations({
      stockId: stockId ? Number(stockId) : undefined,
      relationTypeId: relationTypeId ? Number(relationTypeId) : undefined,
      productId: productId ? Number(productId) : undefined,
    }),
  );
});

relationsRouter.post("/", (req, res) => {
  const input = RelationInputSchema.parse(req.body);
  const relation = createRelation(input);
  placeNearNeighbors(relation.sourceStockId);
  placeNearNeighbors(relation.targetStockId);
  res.status(201).json(relation);
});

relationsRouter.put("/:id", (req, res) => {
  const input = RelationInputSchema.partial().parse(req.body);
  res.json(updateRelation(Number(req.params.id), input));
});

relationsRouter.delete("/:id", (req, res) => {
  deleteRelation(Number(req.params.id));
  res.status(204).end();
});
