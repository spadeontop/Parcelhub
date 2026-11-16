import fs from "fs";
import path from "path";

// Load .env into process.env if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...vParts] = trimmed.split("=");
      if (k && vParts.length > 0 && !process.env[k.trim()]) {
        process.env[k.trim()] = vParts.join("=").trim();
      }
    }
  }
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "186f119c25ef504b47594fb1747672fd13542abc4b0c0a1767dd3b34745c3f2f";
}

import { NextRequest } from "next/server";
import assert from "node:assert";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { fcmTokens, customers, staff } from "../db/schema";
import { signAuthToken, signStaffAuthToken } from "../app/lib/v1/jwt";
import {
  sendFcmNotification,
  removeFcmToken,
  removeUserFcmToken,
  isFcmConfigured,
} from "../app/lib/v1/fcm";

// Route handlers
import { POST as uploadTokenRoute } from "../app/api/v1/notification/upload-token/route";
import { DELETE as deleteTokenRoute } from "../app/api/v1/notification/token/route";

function makeReq(
  url: string,
  options: { method?: string; body?: unknown; token?: string } = {}
) {
  const { method = "GET", body, token } = options;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function runNotificationV1Tests() {
  console.log("🚀 Starting FCM v1 Notification & Token Lifecycle Tests...\n");

  const testCustomerId = `CST-TEST-${Date.now()}`;
  const testStaffId = `STF-TEST-${Date.now()}`;

  // Seed temporary customer and staff for DB existence checks if needed
  await db.insert(customers).values({
    id: testCustomerId,
    email: `fcm_test_${Date.now()}@example.com`,
    passwordHash: "hashed",
    firstName: "FCM",
    lastName: "Tester",
    phoneNumber: "+639000000000",
  });

  await db.insert(staff).values({
    id: testStaffId,
    username: `fcm_staff_${Date.now()}`,
    passwordHash: "hashed",
    firstName: "FCM",
    lastName: "Staff",
  });

  const customerToken = await signAuthToken({
    userId: testCustomerId,
    role: "CUSTOMER",
    email: "fcm_test@example.com",
  });

  const staffToken = await signStaffAuthToken({
    userId: testStaffId,
    role: "STAFF",
    username: "fcm_staff",
  });

  const tokenDevice1 = `fcm_token_device_1_${Date.now()}`;
  const tokenDevice2 = `fcm_token_device_2_${Date.now()}`;
  const tokenStaffDevice = `fcm_token_staff_${Date.now()}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Upload Token Auth Guard
    // -------------------------------------------------------------
    console.log("1. Testing POST /api/v1/notification/upload-token Auth Guards...");
    const unauthReq = makeReq("/api/v1/notification/upload-token", {
      method: "POST",
      body: { fcmToken: tokenDevice1 },
    });
    const unauthRes = await uploadTokenRoute(unauthReq);
    assert.strictEqual(unauthRes.status, 401, "Expected 401 for unauthenticated upload-token request");
    console.log("   ✅ Unauthenticated request rejected (401)");

    // -------------------------------------------------------------
    // Test 2: Upload Token Body Validation
    // -------------------------------------------------------------
    console.log("2. Testing POST /api/v1/notification/upload-token Validation...");
    const emptyBodyReq = makeReq("/api/v1/notification/upload-token", {
      method: "POST",
      token: customerToken,
      body: {},
    });
    const emptyBodyRes = await uploadTokenRoute(emptyBodyReq);
    assert.strictEqual(emptyBodyRes.status, 400, "Expected 400 for missing fcmToken");
    console.log("   ✅ Missing fcmToken rejected with 400");

    // -------------------------------------------------------------
    // Test 3: Customer Uploads Device Token
    // -------------------------------------------------------------
    console.log("3. Testing Customer Token Registration...");
    const uploadReq1 = makeReq("/api/v1/notification/upload-token", {
      method: "POST",
      token: customerToken,
      body: { fcmToken: tokenDevice1 },
    });
    const uploadRes1 = await uploadTokenRoute(uploadReq1);
    assert.strictEqual(uploadRes1.status, 200, "Expected 200 on successful token upload");
    const json1 = (await uploadRes1.json()) as { statusMessage: string };
    assert.strictEqual(json1.statusMessage, "FCM token saved successfully");

    // Verify DB
    const dbToken1 = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.token, tokenDevice1),
    });
    assert.ok(dbToken1, "Token 1 must exist in DB");
    assert.strictEqual(dbToken1.userId, testCustomerId, "Token 1 must belong to testCustomerId");
    console.log("   ✅ Token 1 persisted in DB for customer");

    // -------------------------------------------------------------
    // Test 4: Single-Device Policy (Overwrite previous device token)
    // -------------------------------------------------------------
    console.log("4. Testing Single Active Device Policy (Overwrite)...");
    const uploadReq2 = makeReq("/api/v1/notification/upload-token", {
      method: "POST",
      token: customerToken,
      body: { fcmToken: tokenDevice2 },
    });
    const uploadRes2 = await uploadTokenRoute(uploadReq2);
    assert.strictEqual(uploadRes2.status, 200, "Expected 200 on second device upload");

    // Verify previous token was removed and new token is active
    const oldTokenCheck = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.token, tokenDevice1),
    });
    assert.strictEqual(oldTokenCheck, undefined, "Old device token must be removed upon new registration");

    const newTokenCheck = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.token, tokenDevice2),
    });
    assert.ok(newTokenCheck, "New device token must exist in DB");
    assert.strictEqual(newTokenCheck.userId, testCustomerId);
    console.log("   ✅ Prior device token purged; latest device token successfully assigned");

    // -------------------------------------------------------------
    // Test 5: Staff Token Registration
    // -------------------------------------------------------------
    console.log("5. Testing Staff Token Registration...");
    const staffUploadReq = makeReq("/api/v1/notification/upload-token", {
      method: "POST",
      token: staffToken,
      body: { fcmToken: tokenStaffDevice },
    });
    const staffUploadRes = await uploadTokenRoute(staffUploadReq);
    assert.strictEqual(staffUploadRes.status, 200, "Expected 200 on staff token upload");

    const staffDbToken = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.token, tokenStaffDevice),
    });
    assert.ok(staffDbToken, "Staff token must exist in DB");
    assert.strictEqual(staffDbToken.userId, testStaffId);
    console.log("   ✅ Staff token successfully registered");

    // -------------------------------------------------------------
    // Test 6: In-Process Function sendFcmNotification (Dry-run & Resilience)
    // -------------------------------------------------------------
    console.log("6. Testing sendFcmNotification() In-Process Utility...");
    
    // 6a. User without token
    const noTokenResult = await sendFcmNotification({
      userId: "NON_EXISTENT_USER",
      title: "Test",
      body: "Test Body",
    });
    assert.strictEqual(noTokenResult.success, false);
    assert.strictEqual(noTokenResult.reason, "NO_ACTIVE_DEVICE_TOKEN");
    console.log("   ✅ Correctly handles user with no registered device token");

    // 6b. Dry-run mode for existing user (when FCM_ENABLED=false or no keys)
    assert.strictEqual(typeof isFcmConfigured(), "boolean");
    const dryRunResult = await sendFcmNotification({
      userId: testCustomerId,
      title: "Parcel Ready",
      body: "Your parcel is ready for pickup!",
      notifId: "ORD-999",
      data: { orderId: "ORD-999" },
    });
    // In local dev without keys, it returns success: true with dry-run reason
    assert.strictEqual(dryRunResult.success, true);
    console.log("   ✅ Dry-run dispatch succeeded without throwing exceptions");

    // -------------------------------------------------------------
    // Test 7: DELETE /api/v1/notification/token (Logout Deregistration)
    // -------------------------------------------------------------
    console.log("7. Testing DELETE /api/v1/notification/token (Logout)...");
    
    // 7a. Unauthenticated check
    const unauthDeleteReq = makeReq("/api/v1/notification/token", { method: "DELETE" });
    const unauthDeleteRes = await deleteTokenRoute(unauthDeleteReq);
    assert.strictEqual(unauthDeleteRes.status, 401);
    console.log("   ✅ Unauthenticated DELETE rejected (401)");

    // 7b. Authenticated delete for customer
    const deleteReq = makeReq("/api/v1/notification/token", {
      method: "DELETE",
      token: customerToken,
    });
    const deleteRes = await deleteTokenRoute(deleteReq);
    assert.strictEqual(deleteRes.status, 200);
    const deleteJson = (await deleteRes.json()) as { statusMessage: string };
    assert.strictEqual(deleteJson.statusMessage, "FCM token removed successfully");

    // Verify token is deleted from DB
    const deletedCheck = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.userId, testCustomerId),
    });
    assert.strictEqual(deletedCheck, undefined, "Token must be removed after logout");
    console.log("   ✅ Customer token successfully removed from DB upon logout");

    // Clean up staff token using removeFcmToken and removeUserFcmToken
    await removeFcmToken(tokenStaffDevice);
    await removeUserFcmToken(testStaffId);

    console.log("\n🎉 ALL FCM V1 TESTS PASSED SUCCESSFULLY! (7/7)\n");
  } finally {
    // Teardown
    await db.delete(fcmTokens).where(eq(fcmTokens.userId, testCustomerId));
    await db.delete(fcmTokens).where(eq(fcmTokens.userId, testStaffId));
    await db.delete(customers).where(eq(customers.id, testCustomerId));
    await db.delete(staff).where(eq(staff.id, testStaffId));
  }
  process.exit(0);
}

runNotificationV1Tests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
