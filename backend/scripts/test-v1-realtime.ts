try {
  process.loadEnvFile?.();
} catch {
  // Optional in CI where env vars are injected directly
}
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, staff } from "@/db/schema";
import { signAuthToken, signStaffAuthToken } from "@/app/lib/v1/jwt";
import { broadcastOrderSignal } from "@/app/lib/v1/realtime";
import { POST as issueRealtimeToken } from "@/app/api/v1/realtime/token/route";

const TEST_REALTIME_SECRET =
  process.env.SUPABASE_JWT_SECRET?.trim() || "test-supabase-jwt-secret-min-32-chars-long";

async function runTests() {
  console.log("🚀 Starting V1 Realtime Token & Broadcast Verification...\n");

  const origSupabaseSecret = process.env.SUPABASE_JWT_SECRET;
  const origRealtimeEnabled = process.env.REALTIME_ENABLED;
  const origSupabaseUrl = process.env.SUPABASE_URL;
  const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.SUPABASE_JWT_SECRET = TEST_REALTIME_SECRET;

  const uniqueSuffix = Date.now();
  let testCustomerId: string | null = null;
  let testStaffId: string | null = null;

  try {
    // Seed temporary customer & staff rows
    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Realtime",
        lastName: "Customer",
        email: `realtime-test-${uniqueSuffix}@parcelhub.test`,
        phoneNumber: "09170000001",
        passwordHash: "hashed-placeholder",
      })
      .returning({ id: customers.id, email: customers.email });
    testCustomerId = customer.id;

    const [staffRow] = await db
      .insert(staff)
      .values({
        username: `realtime_staff_${uniqueSuffix}`,
        passwordHash: "hashed-placeholder",
        firstName: "Realtime",
        lastName: "Staff",
      })
      .returning({ id: staff.id, username: staff.username });
    testStaffId = staffRow.id;

    // 1. Unauthenticated request -> 401
    console.log("1. Testing unauthenticated POST /api/v1/realtime/token...");
    const unauthReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
    });
    const unauthRes = await issueRealtimeToken(unauthReq);
    assert.equal(unauthRes.status, 401, "Expected 401 for missing Authorization header");
    console.log("   ✅ Unauthenticated request rejected (401).");

    // 2. Realtime disabled or misconfigured -> 503
    console.log("2. Testing 503 when Realtime is disabled or missing required env vars...");
    const customerAuthToken = await signAuthToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
    });

    process.env.REALTIME_ENABLED = "false";
    process.env.SUPABASE_URL = "https://test-project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    process.env.SUPABASE_JWT_SECRET = TEST_REALTIME_SECRET;

    const disabledReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerAuthToken}` },
    });
    const disabledRes = await issueRealtimeToken(disabledReq);
    assert.equal(disabledRes.status, 503, "Expected 503 when REALTIME_ENABLED=false");

    process.env.REALTIME_ENABLED = "true";
    delete process.env.SUPABASE_URL;
    const missingUrlReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerAuthToken}` },
    });
    const missingUrlRes = await issueRealtimeToken(missingUrlReq);
    assert.equal(missingUrlRes.status, 503, "Expected 503 when SUPABASE_URL is missing");

    process.env.SUPABASE_URL = "https://test-project.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const missingKeyReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerAuthToken}` },
    });
    const missingKeyRes = await issueRealtimeToken(missingKeyReq);
    assert.equal(missingKeyRes.status, 503, "Expected 503 when SUPABASE_SERVICE_ROLE_KEY is missing");

    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    delete process.env.SUPABASE_JWT_SECRET;
    const missingSecretReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerAuthToken}` },
    });
    const missingSecretRes = await issueRealtimeToken(missingSecretReq);
    assert.equal(missingSecretRes.status, 503, "Expected 503 when SUPABASE_JWT_SECRET is missing");
    console.log("   ✅ Disabled/misconfigured Realtime rejected (503).");

    // Restore all 4 env vars before token minting tests
    process.env.REALTIME_ENABLED = "true";
    process.env.SUPABASE_URL = "https://test-project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    process.env.SUPABASE_JWT_SECRET = TEST_REALTIME_SECRET;

    // 3. Valid Customer JWT -> 200 + verified Supabase Realtime claims
    console.log("3. Testing Customer Realtime token minting...");
    const custReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerAuthToken}` },
    });
    const custRes = await issueRealtimeToken(custReq);
    assert.equal(custRes.status, 200, "Expected 200 for valid customer token");
    const custBody = await custRes.json();
    assert.equal(custBody.channel, `customer:${customer.id}`);
    assert.ok(custBody.token && custBody.expiresAt);

    const { payload: custRtPayload } = await jwtVerify(
      custBody.token,
      new TextEncoder().encode(TEST_REALTIME_SECRET),
      { algorithms: ["HS256"] }
    );
    assert.equal(custRtPayload.sub, customer.id);
    assert.equal(custRtPayload.role, "authenticated");
    assert.equal(custRtPayload.user_role, "CUSTOMER");
    assert.equal(custRtPayload.aud, "authenticated");
    assert.ok(typeof custRtPayload.exp === "number");
    console.log("   ✅ Customer token & claims verified.");

    // 4. Valid Staff JWT -> 200 + staff:orders channel
    console.log("4. Testing Staff Realtime token minting...");
    const staffAuthToken = await signStaffAuthToken({
      userId: staffRow.id,
      role: "STAFF",
      username: staffRow.username,
    });
    const staffReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${staffAuthToken}` },
    });
    const staffRes = await issueRealtimeToken(staffReq);
    assert.equal(staffRes.status, 200, "Expected 200 for valid staff token");
    const staffBody = await staffRes.json();
    assert.equal(staffBody.channel, "staff:orders");

    const { payload: staffRtPayload } = await jwtVerify(
      staffBody.token,
      new TextEncoder().encode(TEST_REALTIME_SECRET),
      { algorithms: ["HS256"] }
    );
    assert.equal(staffRtPayload.sub, staffRow.id);
    assert.equal(staffRtPayload.role, "authenticated");
    assert.equal(staffRtPayload.user_role, "STAFF");
    assert.ok(typeof staffRtPayload.exp === "number");
    console.log("   ✅ Staff token & claims verified.");

    // 5. Deleted Staff JWT -> 401
    console.log("5. Testing revoked/deleted Staff JWT rejection...");
    await db.delete(staff).where(eq(staff.id, staffRow.id));
    testStaffId = null;

    const deletedStaffReq = new NextRequest("http://localhost:3000/api/v1/realtime/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${staffAuthToken}` },
    });
    const deletedStaffRes = await issueRealtimeToken(deletedStaffReq);
    assert.equal(deletedStaffRes.status, 401, "Expected 401 for deleted staff account");
    console.log("   ✅ Deleted staff account rejected (401).");

    // 6. broadcastOrderSignal safe no-op & non-fatal error handling
    console.log("6. Testing broadcastOrderSignal no-op & non-fatal failure handling...");
    process.env.REALTIME_ENABLED = "false";
    const noopResult = await broadcastOrderSignal(["staff:orders"], {
      event: "ORDER_CREATED",
      orderId: "test-order-id",
      ticketCode: "ABC-123",
      status: "PAYMENT_REQUIRED",
      updatedAt: new Date().toISOString(),
    });
    assert.equal(noopResult, false, "Expected false when REALTIME_ENABLED=false");

    process.env.REALTIME_ENABLED = "true";
    process.env.SUPABASE_URL = "http://127.0.0.1:1"; // unreachable port -> non-fatal
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    const failResult = await broadcastOrderSignal(["staff:orders"], {
      event: "ORDER_ACTIVATED",
      orderId: "test-order-id",
      ticketCode: "ABC-123",
      status: "AWAITING_PARCEL",
      updatedAt: new Date().toISOString(),
    });
    assert.equal(failResult, false, "Expected non-fatal false on network error");
    console.log("   ✅ broadcastOrderSignal no-op & non-fatal failure verified.");

    console.log("\n🎉 ALL V1 REALTIME TESTS PASSED SUCCESSFULLY!");
  } finally {
    if (testCustomerId) {
      await db.delete(customers).where(eq(customers.id, testCustomerId));
    }
    if (testStaffId) {
      await db.delete(staff).where(eq(staff.id, testStaffId));
    }

    if (origSupabaseSecret === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = origSupabaseSecret;

    if (origRealtimeEnabled === undefined) delete process.env.REALTIME_ENABLED;
    else process.env.REALTIME_ENABLED = origRealtimeEnabled;

    if (origSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = origSupabaseUrl;

    if (origServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey;
  }
}

runTests().catch((err) => {
  console.error("❌ V1 Realtime tests failed:", err);
  process.exit(1);
});
