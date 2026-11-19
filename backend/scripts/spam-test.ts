/**
 * Concurrent API Stress & Spam Benchmark Tool
 *
 * Usage:
 *   npx tsx scripts/spam-test.ts [count] [baseUrl]
 *   npm run test:spam
 *   npm run test:spam -- 100
 *
 * Defaults:
 *   count   = 100 requests
 *   baseUrl = http://localhost:3000
 *   user    = staff / password
 */

interface BenchmarkResult {
  id: number;
  status: number | "ERROR";
  latencyMs: number;
  error?: string;
}

async function runSpammer() {
  const args = process.argv.slice(2);
  const countArg = args.find((a) => !a.startsWith("--") && !isNaN(Number(a))) ||
    args.find((a) => a.startsWith("--count="))?.split("=")[1];
  const totalRequests = countArg ? Math.max(1, parseInt(countArg, 10)) : 100;

  const urlArg = args.find((a) => a.startsWith("http")) ||
    args.find((a) => a.startsWith("--url="))?.split("=")[1];
  const baseUrl = (urlArg || process.env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

  const username = process.env.STAFF_USERNAME || "staff";
  const password = process.env.STAFF_PASSWORD || "password";
  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10);

  console.log("===============================================================");
  console.log("            PARCELHUB STAFF API SPAM BENCHMARK                 ");
  console.log("===============================================================");
  console.log(`🎯 Target URL:       ${baseUrl}`);
  console.log(`👥 Credentials:      ${username} / ******`);
  console.log(`⚡ Concurrent Req:   ${totalRequests}`);
  console.log(`⏱️  Request Timeout:  ${timeoutMs}ms`);
  console.log("===============================================================\n");

  // Step 1: Staff Authentication
  console.log(`[1/3] Authenticating as '${username}' at ${baseUrl}/api/v1/staff/login...`);
  const loginStart = Date.now();
  let authToken: string;

  try {
    const loginController = new AbortController();
    const loginTimeout = setTimeout(() => loginController.abort(), 10000);

    const loginRes = await fetch(`${baseUrl}/api/v1/staff/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: loginController.signal,
    });

    clearTimeout(loginTimeout);

    if (!loginRes.ok) {
      const errBody = await loginRes.text().catch(() => "");
      throw new Error(`Login rejected with HTTP ${loginRes.status}: ${errBody}`);
    }

    const loginData = (await loginRes.json()) as { authToken?: string };
    if (!loginData.authToken) {
      throw new Error("No authToken returned in login response body");
    }

    authToken = loginData.authToken;
    console.log(`✅ Authenticated in ${Date.now() - loginStart}ms. JWT acquired.\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Authentication failed: ${msg}`);
    console.error("   Ensure the Next.js server is running (`npm run dev`) and credentials are valid.");
    process.exit(1);
  }

  // Step 2: Fire Concurrent Requests
  console.log(`[2/3] Spumming ${totalRequests} concurrent requests to GET /api/v1/staff/orders...`);
  const statuses = ["AWAITING_PARCEL", "READY_TO_CLAIM", "PAYMENT_REQUIRED", "CLAIMED", ""];
  const results: BenchmarkResult[] = [];
  const statusCodes: Record<string, number> = {};
  let completed = 0;

  const batchStart = Date.now();

  const sendRequest = async (id: number): Promise<BenchmarkResult> => {
    const statusParam = statuses[id % statuses.length];
    const qs = new URLSearchParams({ limit: "20", offset: "0" });
    if (statusParam) qs.set("status", statusParam);
    const targetUrl = `${baseUrl}/api/v1/staff/orders?${qs.toString()}`;

    const reqStart = Date.now();
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);
      const latencyMs = Date.now() - reqStart;
      const resStatus = res.status;

      statusCodes[resStatus] = (statusCodes[resStatus] || 0) + 1;
      completed++;

      if (completed % Math.max(10, Math.floor(totalRequests / 5)) === 0 || completed === totalRequests) {
        console.log(`   ⏳ Progress: ${completed}/${totalRequests} (${Math.round((completed / totalRequests) * 100)}%) completed...`);
      }

      return { id, status: resStatus, latencyMs };
    } catch (err: unknown) {
      clearTimeout(timeoutHandle);
      const latencyMs = Date.now() - reqStart;
      const errorMsg = err instanceof Error ? err.message : String(err);

      statusCodes["ERROR"] = (statusCodes["ERROR"] || 0) + 1;
      completed++;

      return { id, status: "ERROR", latencyMs, error: errorMsg };
    }
  };

  const tasks = Array.from({ length: totalRequests }, (_, i) => sendRequest(i + 1));
  const settledResults = await Promise.all(tasks);
  const totalBatchDuration = Date.now() - batchStart;

  // Step 3: Post-Spam Health Check Ping
  console.log("\n[3/3] Checking server recovery ping immediately after spam...");
  let recoveryPingMs = -1;
  let recoveryStatus = 0;
  try {
    const pingStart = Date.now();
    const pingRes = await fetch(`${baseUrl}/api/v1/staff/orders?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    recoveryPingMs = Date.now() - pingStart;
    recoveryStatus = pingRes.status;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ Recovery ping failed: ${msg}`);
  }

  // Calculate Metrics
  const latencies = settledResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const avgLatency = Math.round(latencies.reduce((sum, val) => sum + val, 0) / latencies.length);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p90 = latencies[Math.floor(latencies.length * 0.9)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  const successCount = settledResults.filter((r) => r.status === 200).length;
  const failureCount = totalRequests - successCount;
  const successRate = ((successCount / totalRequests) * 100).toFixed(1);
  const rps = ((totalRequests / (totalBatchDuration / 1000))).toFixed(1);

  // Print Report
  console.log("\n===============================================================");
  console.log("                     BENCHMARK SUMMARY REPORT                  ");
  console.log("===============================================================");
  console.log(`Total Requests:         ${totalRequests}`);
  console.log(`Success (HTTP 200):     ${successCount} (${successRate}%)`);
  console.log(`Failed / Dropped:       ${failureCount}`);
  console.log(`Total Batch Duration:   ${totalBatchDuration}ms (${(totalBatchDuration / 1000).toFixed(2)}s)`);
  console.log(`Throughput:             ${rps} requests/second`);
  console.log("---------------------------------------------------------------");
  console.log("Latency Percentiles:");
  console.log(`  Min (Fastest):        ${minLatency}ms`);
  console.log(`  Median (p50):         ${p50}ms`);
  console.log(`  Average:              ${avgLatency}ms`);
  console.log(`  p90:                  ${p90}ms`);
  console.log(`  p95:                  ${p95}ms`);
  console.log(`  p99 (Slowest):        ${p99}ms`);
  console.log(`  Max:                  ${maxLatency}ms`);
  console.log("---------------------------------------------------------------");
  console.log("Status Breakdown:");
  for (const [code, count] of Object.entries(statusCodes)) {
    console.log(`  HTTP ${code}: ${count}`);
  }
  console.log("---------------------------------------------------------------");
  console.log(
    `Post-Spam Health Ping:  ${recoveryStatus === 200 ? "✅ HEALTHY" : "❌ DEGRADED"} (${recoveryPingMs}ms, HTTP ${recoveryStatus})`
  );
  console.log("===============================================================\n");

  if (failureCount > 0) {
    console.warn(`⚠️ Warning: ${failureCount} requests failed or timed out.`);
    process.exit(1);
  } else {
    console.log("🎉 SPAM BENCHMARK PASSED 100% GREEN WITH ZERO DROPPED REQUESTS!");
    process.exit(0);
  }
}

runSpammer().catch((err) => {
  console.error("Fatal benchmark crash:", err);
  process.exit(1);
});
