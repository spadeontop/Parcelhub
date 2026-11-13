import { defineConfig } from "drizzle-kit";

// Auto-load .env so CLI commands (e.g. drizzle-kit push/migrate) pick up DATABASE_URL
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // .env may not exist in CI or certain environments; continue gracefully
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : { url: "./pgdata" },
});


