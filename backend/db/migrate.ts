import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db, pglite } from "./index";

export async function runMigrations() {
  const migrationsFolder = path.resolve(__dirname, "migrations");
  const sqlFiles = fs
    .readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsFolder, file);
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    // Drizzle migration files delimit statements with '--> statement-breakpoint'
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      if (pglite) {
        await pglite.exec(stmt);
      } else {
        await db.execute(sql.raw(stmt));
      }
    }
  }

  // Ensure fcm_tokens_user_id_idx exists
  const indexSql = `CREATE INDEX IF NOT EXISTS "fcm_tokens_user_id_idx" ON "fcm_tokens" ("user_id");`;
  if (pglite) {
    await pglite.exec(indexSql);
  } else {
    await db.execute(sql.raw(indexSql));
  }
}

