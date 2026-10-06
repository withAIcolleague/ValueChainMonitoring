import type { Request } from "express";
import type { ZodSchema } from "zod";

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

/** Express 5's route-level param typing can't see params injected by a parent mount path
 * (e.g. `:id` from `/api/stocks/:id/products`), so sub-routers read them via this cast. */
export function paramNumber(req: Request, key: string): number {
  return Number((req.params as Record<string, string>)[key]);
}
