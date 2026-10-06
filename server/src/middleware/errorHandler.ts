import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "validation_error", issues: err.issues });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal_server_error" });
}

export function notFound(entity: string): never {
  throw new HttpError(404, `${entity} not found`);
}

/** Maps a Postgres error code (from a supabase-js PostgrestError) to the HTTP
 * status a client-facing API should report, falling back to 500 for anything
 * that isn't a client-input problem. */
export function pgErrorStatus(code: string | undefined): number {
  if (code === "23505") return 409; // unique_violation
  if (code === "23503") return 400; // foreign_key_violation
  if (code === "23514") return 400; // check_violation
  return 500;
}
