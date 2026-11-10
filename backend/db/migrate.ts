import fs from "fs";
import path from "path";
import { pglite } from "./index";

export async function runMigrations() {
  const migrationsFolder = path.resolve(__dirname, "migrations");
  const sqlFiles = fs
    .readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsFolder, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    await pglite.exec(sql);
  }
}

