import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(path.resolve(__dirname, "../../.env"));
} catch {
  // .env is optional when the variables are already provided by the environment (e.g. Vercel)
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set (see server/.env)");
}

/** Server-side client using the secret key, which bypasses RLS — only ever
 * imported from trusted server code, never shipped to the client bundle.
 *
 * Transitional: services are being migrated from better-sqlite3 (db/connection.ts)
 * to this Supabase/Postgres client one at a time. Once every service imports from
 * here instead, connection.ts and better-sqlite3 can be deleted. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  db: { schema: "valuechain" },
  auth: { persistSession: false },
});
