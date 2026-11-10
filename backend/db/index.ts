import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import path from "path";
import * as schema from "./schema";

// Global singleton pattern to prevent multiple PGlite instances during Next.js hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __drizzleDb: any | undefined;
}

function createDatabaseClient() {
  if (process.env.DATABASE_URL) {
    // If DATABASE_URL is provided (e.g. Supabase Postgres), lazily require postgres driver
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/postgres-js");
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    return drizzle(client, { schema });
  }

  // Local development: Embedded PGlite in ./pgdata
  const dbPath = path.resolve(process.cwd(), "pgdata");
  const pglite = new PGlite(dbPath);
  return drizzlePglite(pglite, { schema });
}

export const db = global.__drizzleDb ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  global.__drizzleDb = db;
}

