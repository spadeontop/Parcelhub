try {
  process.loadEnvFile?.();
} catch {
  // Optional in CI where env vars are injected directly
}
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as customerLogin } from "@/app/api/v1/customer/login/route";
import { POST as customerMpin } from "@/app/api/v1/customer/mpin/route";
import { POST as staffLogin } from "@/app/api/v1/staff/login/route";
import { POST as issueRealtimeToken } from "@/app/api/v1/realtime/token/route";
import { broadcastOrderSignal, isRealtimeEnabled } from "@/app/lib/v1/realtime";

async function runLiveSimulation() {
  console.log("🚀 Starting V1 Realtime Live Simulation...\n");

  const customerEmail = process.env.TEST_CUSTOMER_EMAIL?.trim();
  const customerPassword = process.env.TEST_CUSTOMER_PASSWORD?.trim();
  const customerMpinVal = process.env.TEST_CUSTOMER_MPIN?.trim();
  const staffUsername = process.env.TEST_STAFF_USERNAME?.trim();
  const staffPassword = process.env.TEST_STAFF_PASSWORD?.trim();

  if (
    !customerEmail ||
    !customerPassword ||
    !customerMpinVal ||
    !staffUsername ||
    !staffPassword
  ) {
    console.log(
      "ℹ️  Skipping live simulation: TEST_CUSTOMER_* and/or TEST_STAFF_* env vars are not set in .env."
    );
    console.log(
      "   Set TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_PASSWORD, TEST_CUSTOMER_MPIN, TEST_STAFF_USERNAME, and TEST_STAFF_PASSWORD to run."
    );
    process.exit(0);
  }

  // 1. Customer Login
  console.log(`1. Logging in customer (${customerEmail})...`);
  const loginRes = await customerLogin(
    new NextRequest("http://localhost:3000/api/v1/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: customerEmail, password: customerPassword }),
    })
  );
  const loginBody = await loginRes.json();
  assert.equal(
    loginRes.status,
    200,
    `Customer login failed (${loginRes.status}): ${loginBody.message || loginBody.error}`
  );
  console.log("   ✅ Customer login succeeded (preAuthToken received).");

  // 2. Customer MPIN Verification
  console.log("2. Verifying customer MPIN...");
  const mpinRes = await customerMpin(
    new NextRequest("http://localhost:3000/api/v1/customer/mpin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preAuthToken: loginBody.preAuthToken,
        mpin: customerMpinVal,
      }),
    })
  );
  const mpinBody = await mpinRes.json();
  assert.equal(
    mpinRes.status,
    200,
    `Customer MPIN failed (${mpinRes.status}): ${mpinBody.message || mpinBody.error}`
  );
  console.log("   ✅ Customer MPIN verified (authToken received).");

  // 3. Mint Customer Realtime Token
  console.log("3. Minting Customer Realtime token...");
  const custRtRes = await issueRealtimeToken(
    new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${mpinBody.authToken}` },
    })
  );
  const custRtBody = await custRtRes.json();
  assert.equal(
    custRtRes.status,
    200,
    `Customer realtime token failed (${custRtRes.status}): ${custRtBody.message || custRtBody.error}`
  );
  console.log(`   ✅ Customer Realtime token minted -> channel: ${custRtBody.channel}`);

  // 4. Staff Login
  console.log(`4. Logging in staff (${staffUsername})...`);
  const staffRes = await staffLogin(
    new NextRequest("http://localhost:3000/api/v1/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: staffUsername, password: staffPassword }),
    })
  );
  const staffBody = await staffRes.json();
  assert.equal(
    staffRes.status,
    200,
    `Staff login failed (${staffRes.status}): ${staffBody.message || staffBody.error}`
  );
  console.log("   ✅ Staff login succeeded (authToken received).");

  // 5. Mint Staff Realtime Token
  console.log("5. Minting Staff Realtime token...");
  const staffRtRes = await issueRealtimeToken(
    new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${staffBody.authToken}` },
    })
  );
  const staffRtBody = await staffRtRes.json();
  assert.equal(
    staffRtRes.status,
    200,
    `Staff realtime token failed (${staffRtRes.status}): ${staffRtBody.message || staffRtBody.error}`
  );
  console.log(`   ✅ Staff Realtime token minted -> channel: ${staffRtBody.channel}`);

  // 6. Live Supabase Realtime Broadcast
  if (!isRealtimeEnabled()) {
    console.log(
      "6. ℹ️  REALTIME_ENABLED is not true (or SUPABASE_* env vars missing) — skipping live HTTP broadcast."
    );
  } else {
    console.log(
      `6. Broadcasting live ORDER_READY signal to [${staffRtBody.channel}, ${custRtBody.channel}]...`
    );
    const ok = await broadcastOrderSignal(
      [staffRtBody.channel, custRtBody.channel],
      {
        event: "ORDER_READY",
        orderId: "sim-live-order-001",
        ticketCode: "SIM-999",
        status: "READY_TO_CLAIM",
        updatedAt: new Date().toISOString(),
      }
    );
    assert.equal(ok, true, "Live Supabase Realtime Broadcast failed");
    console.log("   ✅ Live Supabase Realtime Broadcast accepted (202 OK)!");
  }

  console.log("\n🎉 LIVE REALTIME SIMULATION COMPLETED SUCCESSFULLY!");
  process.exit(0);
}

runLiveSimulation().catch((err) => {
  console.error("❌ Live Realtime simulation failed:", err);
  process.exit(1);
});
