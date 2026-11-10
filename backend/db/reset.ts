import fs from "fs";
import path from "path";
import { seedDatabase } from "./seed";

async function resetDatabase() {
  console.log("🧹 Resetting database...");

  const pgdataPath = path.resolve(process.cwd(), "pgdata");
  if (fs.existsSync(pgdataPath)) {
    fs.rmSync(pgdataPath, { recursive: true, force: true });
    console.log("Deleted ./pgdata directory.");
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

