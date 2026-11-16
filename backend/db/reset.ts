import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db, pglite } from "./index";
import { seedDatabase } from "./seed";

async function resetDatabase() {
  console.log("🧹 Resetting database...");

  if (!pglite) {
    console.log("Wiping and resetting public schema on hosted PostgreSQL...");
    await db.execute(
      sql.raw(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `)
    );
    console.log("Recreated public schema.");
  } else {
    const pgdataPath = path.resolve(process.cwd(), "pgdata");
    if (fs.existsSync(pgdataPath)) {
      fs.rmSync(pgdataPath, { recursive: true, force: true });
      console.log("Deleted ./pgdata directory.");
    }
  }

  // Re-seed fresh state
  await seedDatabase();
  console.log("✨ Database reset & re-seeded successfully!");
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  });

