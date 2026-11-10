import fs from "fs";
import path from "path";
import { pglite } from "./index";

export async function runMigrations() {
  // Create migrations tracking table if not exists
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      "id" SERIAL PRIMARY KEY,
      "hash" text NOT NULL UNIQUE,
      "created_at" timestamp with time zone DEFAULT now()
    );
  `);

  const executedRows = await pglite.query(
    `SELECT "hash" FROM "__drizzle_migrations";`
  );
  const executedHashes = new Set((executedRows.rows as any[]).map((r: any) => r.hash));

  const migrationsFolder = path.resolve(__dirname, "migrations");
  const sqlFiles = fs
    .readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    if (executedHashes.has(file)) continue;

    const filePath = path.join(migrationsFolder, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    await pglite.exec(sql);
    await pglite.exec(
      `INSERT INTO "__drizzle_migrations" ("hash") VALUES ('${file}');`
    );
  }
}
