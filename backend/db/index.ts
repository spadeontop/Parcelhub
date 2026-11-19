import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";

// Auto-load .env into process.env so DATABASE_URL is available for CLI scripts and Next.js
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...vParts] = trimmed.split("=");
      if (k && vParts.length > 0 && !process.env[k.trim()]) {
        let val = vParts.join("=").trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[k.trim()] = val;
      }
    }
  }
}

// Global singleton pattern to prevent multiple PGlite instances during Next.js hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __drizzleDb: any | undefined;
}

function createDatabaseClient() {
  if (process.env.DATABASE_URL) {
    // If DATABASE_URL is provided (e.g. Supabase Postgres), lazily require postgres driver
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgresMod = require("postgres");
    const postgres = postgresMod.default || postgresMod;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/postgres-js");
    const client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 5,
      // Disable query pipelining: Supabase Transaction Pooler (:6543) drops/hangs
      // pipelined extended-protocol queries, deadlocking pooled connections.
      max_pipeline: 1,
      ssl: "require",
      connect_timeout: 10,
      idle_timeout: 20,
      queue_timeout: 10,
      query_timeout: 15,
    });
    return { db: drizzle(client, { schema }), pglite: undefined };
  }

  // Local development: Embedded PGlite in ./pgdata
  const dbPath = path.resolve(process.cwd(), "pgdata");
  const client = new PGlite(dbPath);
  return { db: drizzlePglite(client, { schema }), pglite: client };
}

const instance = global.__drizzleDb ?? createDatabaseClient();

global.__drizzleDb = instance;

export const db = instance.db;
export const pglite = instance.pglite;

