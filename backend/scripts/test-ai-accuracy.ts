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

// Force AI_VERIFICATION=true in-process for accuracy evaluation
process.env.AI_VERIFICATION = "true";

import { verifyOrderScreenshot } from "../app/lib/v1/ai-verification";
import type { ScreenshotSourceApp } from "../app/types/v1/api";

type ExpectedOutcome = {
  sourceApp: ScreenshotSourceApp;
  isParcel: boolean;
  hasRealMetadata: boolean;
  trackingId: string | null;
  productName?: string | null;
  recipientName?: string;
  price?: number | null;
};

type AccuracyCase = {
  id: string;
  file: string;
  scenario: "full" | "order_id_only" | "no_metadata" | "other";
  customerFullName?: string;
  expected: ExpectedOutcome;
};

const FIXTURES_DIR = path.resolve(__dirname, "ai-fixtures");
const CASES_PATH = path.join(FIXTURES_DIR, "cases.json");

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function toDataUri(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return `data:${getMimeType(filePath)};base64,${buffer.toString("base64")}`;
}

function compareCase(
  testCase: AccuracyCase,
  actual: Awaited<ReturnType<typeof verifyOrderScreenshot>>
): string[] {
  const failures: string[] = [];
  const exp = testCase.expected;

  if (!actual.checks || !actual.autofill) {
    failures.push(`AI call failed: ${actual.reason ?? "missing checks/autofill"}`);
    return failures;
  }

  if (actual.sourceApp !== exp.sourceApp) {
    failures.push(`sourceApp: expected "${exp.sourceApp}", got "${actual.sourceApp}"`);
  }
  if (Boolean(actual.checks.isParcel) !== exp.isParcel) {
    failures.push(`isParcel: expected ${exp.isParcel}, got ${actual.checks.isParcel}`);
  }
  if (Boolean(actual.checks.hasRealMetadata) !== exp.hasRealMetadata) {
    failures.push(
      `hasRealMetadata: expected ${exp.hasRealMetadata}, got ${actual.checks.hasRealMetadata}`
    );
  }

  if (exp.trackingId === null) {
    if (actual.autofill.trackingId !== null) {
      failures.push(`trackingId: expected null, got "${actual.autofill.trackingId}"`);
    }
  } else if (
    (actual.autofill.trackingId ?? "").toUpperCase() !== exp.trackingId.toUpperCase()
  ) {
    failures.push(
      `trackingId: expected "${exp.trackingId}", got "${actual.autofill.trackingId}"`
    );
  }

  if (exp.productName !== undefined) {
    if (exp.productName === null) {
      if (actual.autofill.productName !== null) {
        failures.push(`productName: expected null, got "${actual.autofill.productName}"`);
      }
    } else if (
      !(actual.autofill.productName ?? "")
        .toLowerCase()
        .includes(exp.productName.toLowerCase())
    ) {
      failures.push(
        `productName: expected to include "${exp.productName}", got "${actual.autofill.productName}"`
      );
    }
  }

  if (exp.recipientName !== undefined) {
    if (
      actual.autofill.recipientName.toLowerCase() !== exp.recipientName.toLowerCase()
    ) {
      failures.push(
        `recipientName: expected "${exp.recipientName}", got "${actual.autofill.recipientName}"`
      );
    }
  }

  if (exp.price !== undefined) {
    if (exp.price === null) {
      if (actual.autofill.price !== null) {
        failures.push(`price: expected null, got ${actual.autofill.price}`);
      }
    } else if (
      actual.autofill.price === null ||
      Math.abs(actual.autofill.price - exp.price) >= 0.01
    ) {
      failures.push(`price: expected ${exp.price}, got ${actual.autofill.price}`);
    }
  }

  return failures;
}

async function runAccuracySuite() {
  if (!fs.existsSync(CASES_PATH)) {
    console.error(
      `❌ Missing ${CASES_PATH}. Copy cases.example.json to cases.json and add your anonymized screenshots.`
    );
    process.exit(1);
  }

  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf-8")) as AccuracyCase[];
  if (!Array.isArray(cases) || cases.length === 0) {
    console.error("❌ cases.json is empty.");
    process.exit(1);
  }

  console.log(`🧪 Running AI Accuracy Suite (${cases.length} cases)...\n`);

  let passed = 0;
  let sumInputTokens = 0;
  let sumOutputTokens = 0;
  let sumTotalTokens = 0;

  for (const testCase of cases) {
    const imgPath = path.join(FIXTURES_DIR, testCase.file);
    if (!fs.existsSync(imgPath)) {
      console.log(`❌ [${testCase.id}] Missing image file: ${testCase.file}`);
      continue;
    }

    const start = Date.now();
    const result = await verifyOrderScreenshot({
      imageUrl: toDataUri(imgPath),
      customerFullName: testCase.customerFullName ?? "Juan Dela Cruz",
    });
    const elapsedMs = Date.now() - start;

    const inTok = result.usage?.inputTokens ?? 0;
    const outTok = result.usage?.outputTokens ?? 0;
    const totTok = result.usage?.totalTokens ?? inTok + outTok;
    sumInputTokens += inTok;
    sumOutputTokens += outTok;
    sumTotalTokens += totTok;

    const metaLine = `   meta: model=${result.model ?? "n/a"} | provider=${result.provider ?? process.env.OPENROUTER_PROVIDER_ONLY ?? "auto"} | tokens=${inTok} in / ${outTok} out (${totTok} total)${result.usage?.cost != null ? ` | cost=$${result.usage.cost}` : ""}`;

    const failures = compareCase(testCase, result);
    if (failures.length === 0) {
      passed++;
      console.log(`✅ [${testCase.id}] (${testCase.scenario}) - ${elapsedMs}ms`);
      console.log(metaLine);
    } else {
      console.log(`❌ [${testCase.id}] (${testCase.scenario}) - ${elapsedMs}ms`);
      console.log(metaLine);
      for (const f of failures) {
        console.log(`   - ${f}`);
      }
    }
  }

  const pct = Math.round((passed / cases.length) * 100);
  console.log(`\n📊 Accuracy: ${passed}/${cases.length} passed (${pct}%)`);
  console.log(
    `🪙 Total Tokens: ${sumInputTokens} in / ${sumOutputTokens} out (${sumTotalTokens} total)`
  );

  if (passed < cases.length) {
    process.exit(1);
  }
}

runAccuracySuite().catch((err) => {
  console.error("❌ Unexpected accuracy suite error:", err);
  process.exit(1);
});
