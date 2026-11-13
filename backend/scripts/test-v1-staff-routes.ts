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
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { customers, orders, staff } from "../db/schema";
import { signAuthToken } from "../app/lib/v1/jwt";

// v1 Staff Route Handlers
import { POST as staffLogin } from "../app/api/v1/staff/login/route";
import { GET as listStaffOrders } from "../app/api/v1/staff/orders/route";
import { GET as getStaffOrder } from "../app/api/v1/staff/orders/[id]/route";
import { POST as activateOrder } from "../app/api/v1/staff/orders/[id]/activate/route";
import { POST as payCourier } from "../app/api/v1/staff/orders/[id]/make-claimable/pay/route";
import { POST as attachPhoto } from "../app/api/v1/staff/orders/[id]/make-claimable/attach-photo/route";
import { POST as releaseOrder } from "../app/api/v1/staff/orders/[id]/claim/route";

// v1 Customer Route Handler (used to test real claim pass handoff)
import { POST as initiateCustomerClaim } from "../app/api/v1/customer/orders/[id]/claim/route";

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

async function runV1StaffSuite() {
  console.log("🚀 Starting V1 Staff API Route Verification (Direct NextRequest Handlers)...\n");

  const suffix = `${Date.now()}`;
  const testStaffId = `STF-TEST-${suffix}`;
  const testStaffUsername = `test_staff_${suffix}`;
  const testStaffPassword = "StaffTestPassword123!";

  const testCustomerId = `CST-TEST-${suffix}`;
  const testCustomerEmail = `test_staff_cust_${suffix}@example.com`;

  const testOrderId = `ORD-TEST-${suffix}`;
  const testTicketCode = `TST-${suffix.slice(-4)}`;
  const testTrackingId = `PH-TEST-${suffix}`;

  try {
    // ---------------------------------------------------------
    // Setup Ephemeral Fixtures (No Seed Dependency)
    // ---------------------------------------------------------
    const [staffHash, customerHash] = await Promise.all([
      bcrypt.hash(testStaffPassword, 10),
      bcrypt.hash("CustomerPass123!", 10),
    ]);

    await db.insert(staff).values({
      id: testStaffId,
      username: testStaffUsername,
      passwordHash: staffHash,
      firstName: "Test",
      lastName: "Staff",
    });

    await db.insert(customers).values({
      id: testCustomerId,
      email: testCustomerEmail,
      passwordHash: customerHash,
      firstName: "Test",
      lastName: "Customer",
      phoneNumber: "+639123456789",
      blacklisted: false,
    });

    await db.insert(orders).values({
      id: testOrderId,
      ticketCode: testTicketCode,
      trackingId: testTrackingId,
      productName: "Test Wireless Mouse",
      recipientName: "Test Customer",
      price: 480,
      change: 0,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED",
      statusTimeline: [
        { status: "PENDING_INITIALIZATION", timestamp: new Date().toISOString() },
        { status: "PAYMENT_REQUIRED", timestamp: new Date().toISOString() },
      ],
      customerId: testCustomerId,
      modifiedBy: testStaffId,
      courierPaid: false,
    });

    const customerAuthToken = await signAuthToken({
      userId: testCustomerId,
      role: "CUSTOMER",
      email: testCustomerEmail,
    });

    // ---------------------------------------------------------
    // 1. Login Validation & Success
    // ---------------------------------------------------------
    console.log("1. Testing Staff Login (POST /api/v1/staff/login)...");
    const missingCredsRes = await staffLogin(
      makeReq("/api/v1/staff/login", { method: "POST", body: { username: testStaffUsername } })
    );
    assert.strictEqual(missingCredsRes.status, 400, "Missing password must return 400");

    const badLoginRes = await staffLogin(
      makeReq("/api/v1/staff/login", {
        method: "POST",
        body: { username: testStaffUsername, password: "wrongpassword" },
      })
    );
    assert.strictEqual(badLoginRes.status, 401, "Wrong password must return 401");

    const goodLoginRes = await staffLogin(
      makeReq("/api/v1/staff/login", {
        method: "POST",
        body: { username: testStaffUsername, password: testStaffPassword },
      })
    );
    assert.strictEqual(goodLoginRes.status, 200, "Valid credentials must return 200");
    const loginData = await goodLoginRes.json();
    assert.ok(loginData.authToken, "Must receive authToken");
    assert.ok(loginData.refreshToken, "Must receive refreshToken");
    const authToken: string = loginData.authToken;
    console.log("   ✅ Missing fields (400), wrong password (401), and valid login (200) verified.");

    // ---------------------------------------------------------
    // 2. Auth & Cross-Role Isolation Guards
    // ---------------------------------------------------------
    console.log("\n2. Testing Auth & Cross-Role Isolation Guards...");
    const unauthListRes = await listStaffOrders(makeReq("/api/v1/staff/orders"));
    assert.strictEqual(unauthListRes.status, 401, "Missing bearer token must return 401");

    const customerOnStaffRes = await listStaffOrders(
      makeReq("/api/v1/staff/orders", { token: customerAuthToken })
    );
    assert.strictEqual(
      customerOnStaffRes.status,
      401,
      "Customer JWT must be rejected on staff endpoints"
    );
    console.log("   ✅ Missing token (401) and customer-role token cross-isolation (401) verified.");

    // ---------------------------------------------------------
    // 3. List Orders & Filters
    // ---------------------------------------------------------
    console.log("\n3. Testing List Orders & Filters (GET /api/v1/staff/orders)...");
    const invalidStatusRes = await listStaffOrders(
      makeReq("/api/v1/staff/orders?status=NOT_A_REAL_STATUS", { token: authToken })
    );
    assert.strictEqual(invalidStatusRes.status, 400, "Invalid status filter must return 400");

    const listRes = await listStaffOrders(
      makeReq("/api/v1/staff/orders?status=PAYMENT_REQUIRED&limit=50", { token: authToken })
    );
    assert.strictEqual(listRes.status, 200, "Authorized list should return 200");
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.orders), "orders must be an array");
    assert.ok(listData.pagination, "pagination metadata must be returned");
    assert.ok(
      listData.orders.some((o: { id: string }) => o.id === testOrderId),
      "Ephemeral PAYMENT_REQUIRED order must appear in filtered list"
    );
    console.log(`   ✅ Orders listed & filtered (${listData.orders.length} returned, invalid status rejected 400).`);

    // ---------------------------------------------------------
    // 4. View Order Details by ID, TicketCode, and 404 Guard
    // ---------------------------------------------------------
    console.log("\n4. Testing View Order Details (GET /api/v1/staff/orders/[id])...");
    const notFoundRes = await getStaffOrder(
      makeReq("/api/v1/staff/orders/ORD-DOES-NOT-EXIST", { token: authToken }),
      { params: Promise.resolve({ id: "ORD-DOES-NOT-EXIST" }) }
    );
    assert.strictEqual(notFoundRes.status, 404, "Non-existent order must return 404");

    const byIdRes = await getStaffOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}`, { token: authToken }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(byIdRes.status, 200);
    const byIdData = await byIdRes.json();
    assert.strictEqual(byIdData.orderId, testOrderId);

    const byCodeRes = await getStaffOrder(
      makeReq(`/api/v1/staff/orders/${testTicketCode}`, { token: authToken }),
      { params: Promise.resolve({ id: testTicketCode }) }
    );
    assert.strictEqual(byCodeRes.status, 200);
    const byCodeData = await byCodeRes.json();
    assert.strictEqual(byCodeData.orderId, testOrderId);
    console.log("   ✅ Order retrieved by ID and ticketCode (200), non-existent rejected (404).");

    // ---------------------------------------------------------
    // 5. Order Activation (Underpayment Guard, Success, & Re-activation Guard)
    // ---------------------------------------------------------
    console.log("\n5. Testing Order Activation (POST /api/v1/staff/orders/[id]/activate)...");
    const underpayRes = await activateOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}/activate`, {
        method: "POST",
        token: authToken,
        body: { amountReceived: 100 }, // price is 480
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(underpayRes.status, 400, "Underpayment must return 400");

    const activateRes = await activateOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}/activate`, {
        method: "POST",
        token: authToken,
        body: { amountReceived: 500 }, // change = 20
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(activateRes.status, 200, "Valid activation must return 200");
    const activateData = await activateRes.json();
    assert.strictEqual(activateData.change, 20);

    const reactivateRes = await activateOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}/activate`, {
        method: "POST",
        token: authToken,
        body: { amountReceived: 500 },
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(reactivateRes.status, 400, "Re-activating AWAITING_PARCEL order must return 400");
    console.log("   ✅ Underpayment (400), activation to AWAITING_PARCEL (200, change=20), and re-activation guard (400) verified.");

    // ---------------------------------------------------------
    // 6. Make-Claimable Sequence (Photo-before-Pay Guard, Pay, Double-Pay, Photo)
    // ---------------------------------------------------------
    console.log("\n6. Testing Make-Claimable Sequence (pay -> attach-photo)...");
    const photoBeforePayRes = await attachPhoto(
      makeReq(`/api/v1/staff/orders/${testOrderId}/make-claimable/attach-photo`, {
        method: "POST",
        token: authToken,
        body: { imageUrl: "https://storage.parcelhub.com/proof/premature.jpg" },
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(
      photoBeforePayRes.status,
      400,
      "Attaching proof photo before courier payment must return 400"
    );

    const payRes = await payCourier(
      makeReq(`/api/v1/staff/orders/${testOrderId}/make-claimable/pay`, {
        method: "POST",
        token: authToken,
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(payRes.status, 200, "Courier payment must return 200");

    const doublePayRes = await payCourier(
      makeReq(`/api/v1/staff/orders/${testOrderId}/make-claimable/pay`, {
        method: "POST",
        token: authToken,
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(doublePayRes.status, 400, "Duplicate courier payment must return 400");

    // Test oversized staff photo rejection (> 200KB)
    const oversizedStaffBase64 = `data:image/webp;base64,${Buffer.alloc(210 * 1024, 0x41).toString("base64")}`;
    const oversizePhotoRes = await attachPhoto(
      makeReq(`/api/v1/staff/orders/${testOrderId}/make-claimable/attach-photo`, {
        method: "POST",
        token: authToken,
        body: { imageUrl: oversizedStaffBase64 },
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    const oversizePhotoJson = await oversizePhotoRes.json();
    assert.strictEqual(oversizePhotoRes.status, 400, "Oversized staff image (>200KB) must return 400");
    assert.strictEqual(oversizePhotoJson.error, "ImagePayloadTooLarge", "Staff error must be ImagePayloadTooLarge");
    console.log("   ✅ Oversized staff photo guard (>200KB) rejected with 400 ImagePayloadTooLarge.");

    const photoRes = await attachPhoto(
      makeReq(`/api/v1/staff/orders/${testOrderId}/make-claimable/attach-photo`, {
        method: "POST",
        token: authToken,
        body: { imageUrl: "https://storage.parcelhub.com/proof/test.jpg" },
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(photoRes.status, 200, "Attaching proof photo after payment must return 200");
    console.log("   ✅ Photo-before-pay guard (400), courier pay (200), duplicate pay guard (400), and attach-photo -> READY_TO_CLAIM (200) verified.");

    // ---------------------------------------------------------
    // 7. Claim Order Guards & Full Claim Completion
    // ---------------------------------------------------------
    console.log("\n7. Testing Claim Guards & Full Release (POST /api/v1/staff/orders/[id]/claim)...");
    // A) Uninitiated claim pass -> 403
    const uninitiatedRes = await releaseOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}/claim`, {
        method: "POST",
        token: authToken,
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(uninitiatedRes.status, 403, "Uninitiated claim must return 403");

    // B) Expired claim pass -> 403
    const pastTime = new Date(Date.now() - 60_000);
    await db
      .update(orders)
      .set({
        claimRequested: true,
        claimInitiatedAt: new Date(Date.now() - 360_000),
        claimExpiresAt: pastTime,
      })
      .where(eq(orders.id, testOrderId));

    const expiredClaimRes = await releaseOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}/claim`, {
        method: "POST",
        token: authToken,
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(expiredClaimRes.status, 403, "Expired claim window must return 403");

    // C) Customer initiates valid active claim pass -> Staff releases parcel -> 200 CLAIMED
    const customerClaimRes = await initiateCustomerClaim(
      makeReq(`/api/v1/customer/orders/${testOrderId}/claim`, {
        method: "POST",
        token: customerAuthToken,
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(customerClaimRes.status, 200, "Customer claim initiation must return 200");

    const releaseRes = await releaseOrder(
      makeReq(`/api/v1/staff/orders/${testOrderId}/claim`, {
        method: "POST",
        token: authToken,
      }),
      { params: Promise.resolve({ id: testOrderId }) }
    );
    assert.strictEqual(releaseRes.status, 200, "Staff claim with active window must return 200");

    const finalOrder = await db.query.orders.findFirst({
      where: eq(orders.id, testOrderId),
    });
    assert.strictEqual(finalOrder?.status, "CLAIMED", "Order status in DB must be CLAIMED");
    assert.strictEqual(finalOrder?.claimRequested, false, "claimRequested flag must be cleared");
    console.log("   ✅ Uninitiated guard (403), expired window guard (403), and active claim completion -> CLAIMED (200) verified.");

    console.log("\n🎉 ALL V1 STAFF API TESTS PASSED SUCCESSFULLY (100% GREEN)!\n");
  } finally {
    console.log("🧹 Cleaning up ephemeral test database records...");
    await db.delete(orders).where(eq(orders.id, testOrderId));
    await db.delete(customers).where(eq(customers.id, testCustomerId));
    await db.delete(staff).where(eq(staff.id, testStaffId));
    console.log("   ✅ Ephemeral test records cleaned up.");
  }
}

runV1StaffSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
