import fs from "fs";
import path from "path";

// Load backend/.env if present
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...vParts] = trimmed.split("=");
    if (k && vParts.length > 0 && !process.env[k.trim()]) {
      process.env[k.trim()] = vParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

// Force AI_VERIFICATION=true in-process for this smoke test
process.env.AI_VERIFICATION = "true";

import { verifyOrderScreenshot } from "../app/lib/v1/ai-verification";

// 1x1 transparent PNG
const DUMMY_IMAGE_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function runHealthCheck() {
  console.log("🩺 Running OpenRouter AI Verification Health Check...");
  console.log(`   Model:    ${process.env.OPENROUTER_MODEL || "(unset)"}`);
  console.log(`   Provider: ${process.env.OPENROUTER_PROVIDER_ONLY || "(any)"}`);
  console.log(`   Fallback: ${process.env.OPENROUTER_ALLOW_FALLBACKS ?? "(default)"}`);
  console.log(
    `   Reasoning: enabled=${process.env.OPENROUTER_REASONING_ENABLED ?? "(unset)"}, effort=${process.env.OPENROUTER_REASONING_EFFORT ?? "(unset)"}`
  );

  const start = Date.now();
  const result = await verifyOrderScreenshot({
    imageUrl: DUMMY_IMAGE_DATA_URI,
    customerFullName: "Health Check User",
  });
  const elapsedMs = Date.now() - start;

  console.log(`\n⏱️  Latency: ${elapsedMs}ms`);
  console.log("📦 Result:", JSON.stringify(result, null, 2));

  if (!result.checks) {
    console.error(`\n❌ Health check failed: ${result.reason ?? "No structured checks returned"}`);
    process.exit(1);
  }

  console.log("\n✅ Health check passed! OpenRouter returned valid strict JSON.");
}

runHealthCheck().catch((err) => {
  console.error("❌ Unexpected health check error:", err);
  process.exit(1);
});
