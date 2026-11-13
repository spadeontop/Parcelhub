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
import { customers, orders, orderScreenshots } from "../db/schema";

// v1 Customer Route Handlers
import { POST as registerCustomer } from "../app/api/v1/customer/register/route";
import { POST as loginCustomer } from "../app/api/v1/customer/login/route";
import { POST as createMpin } from "../app/api/v1/customer/create-mpin/route";
import { POST as verifyMpin } from "../app/api/v1/customer/mpin/route";
import { POST as refreshAuthToken } from "../app/api/v1/customer/refresh/route";
import { GET as getCustomerProfile } from "../app/api/v1/customer/profile/route";
import { GET as listCustomerOrders } from "../app/api/v1/customer/orders/route";
import { POST as initCustomerOrder } from "../app/api/v1/customer/orders/initialize/route";
import {
  GET as getCustomerOrder,
  PUT as updateCustomerOrder,
} from "../app/api/v1/customer/orders/[id]/route";
import { GET as getCustomerOrderPhoto } from "../app/api/v1/customer/orders/[id]/photo/route";
import { POST as claimCustomerOrder } from "../app/api/v1/customer/orders/[id]/claim/route";

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

async function runV1CustomerTests() {
  console.log("🚀 Starting V1 Customer API Route Verification...\n");

  const testEmail = `test_customer_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  const testMpin = "1234";
  const trackingNumber = `TRACK-${Date.now()}`;

  let preAuthToken: string = "";
  let authToken: string = "";
  let refreshToken: string = "";
  let customerId: string = "";
  let createdOrderId: string = "";
  let secondOrderId: string = "";
  let thirdOrderId: string = "";

  try {
    // ==========================================
    // 1. Customer Registration
    // ==========================================
    console.log("1. Testing Registration (POST /api/v1/customer/register)...");
    const regReq = makeReq("http://localhost:3000/api/v1/customer/register", {
      method: "POST",
      body: {
        email: testEmail,
        password: testPassword,
        firstName: "V1Test",
        lastName: "User",
        phoneNumber: "+639990001111",
      },
    });
    const regRes = await registerCustomer(regReq);
    const regJson = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Expected 201 Created, got ${regRes.status}: ${JSON.stringify(regJson)}`);
    assert.ok(regJson.preAuthToken, "preAuthToken must be returned on register");
    preAuthToken = regJson.preAuthToken;
    console.log("   ✅ Registration successful. Received preAuthToken.");

    // ==========================================
    // 2. MPIN Setup
    // ==========================================
    console.log("2. Testing MPIN Setup (POST /api/v1/customer/create-mpin)...");
    const mpinSetupReq = makeReq("http://localhost:3000/api/v1/customer/create-mpin", {
      method: "POST",
      body: {
        preAuthToken,
        mpin: testMpin,
      },
    });
    const mpinSetupRes = await createMpin(mpinSetupReq);
    const mpinSetupJson = await mpinSetupRes.json();
    assert.strictEqual(mpinSetupRes.status, 200, `Expected 200 OK, got ${mpinSetupRes.status}`);
    assert.ok(mpinSetupJson.authToken, "authToken must be returned on create-mpin");
    assert.ok(mpinSetupJson.refreshToken, "refreshToken must be returned on create-mpin");
    assert.ok(mpinSetupJson.customer?.id, "customer id must be returned");

    authToken = mpinSetupJson.authToken;
    refreshToken = mpinSetupJson.refreshToken;
    customerId = mpinSetupJson.customer.id;
    console.log(`   ✅ MPIN set successfully for customer ID: ${customerId}`);

    // 2b. Testing MPIN Overwrite Protection (POST /api/v1/customer/create-mpin)
    console.log("2b. Testing MPIN Overwrite Protection (POST /api/v1/customer/create-mpin)...");
    const mpinDuplicateReq = makeReq("http://localhost:3000/api/v1/customer/create-mpin", {
      method: "POST",
      body: {
        preAuthToken,
        mpin: "5678",
      },
    });
    const mpinDuplicateRes = await createMpin(mpinDuplicateReq);
    const mpinDuplicateJson = await mpinDuplicateRes.json();
    assert.strictEqual(
      mpinDuplicateRes.status,
      409,
      `Expected 409 Conflict when attempting to overwrite MPIN, got ${mpinDuplicateRes.status}`
    );
    assert.strictEqual(
      mpinDuplicateJson.message,
      "MPIN is already set. Please log in or use MPIN verification."
    );
    console.log("   ✅ MPIN overwrite protection verified (409 Conflict).");

    // ==========================================
    // 3. Customer Login + MPIN Verification
    // ==========================================
    console.log("3. Testing Customer Login (POST /api/v1/customer/login)...");
    const loginReq = makeReq("http://localhost:3000/api/v1/customer/login", {
      method: "POST",
      body: {
        email: testEmail,
        password: testPassword,
      },
    });
    const loginRes = await loginCustomer(loginReq);
    const loginJson = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, `Expected 200, got ${loginRes.status}`);
    assert.ok(loginJson.preAuthToken, "Login must yield preAuthToken");
    console.log("   ✅ Login successful, returned preAuthToken.");

    console.log("4. Testing Verify MPIN (POST /api/v1/customer/mpin)...");
    const verifyMpinReq = makeReq("http://localhost:3000/api/v1/customer/mpin", {
      method: "POST",
      body: {
        preAuthToken: loginJson.preAuthToken,
        mpin: testMpin,
      },
    });
    const verifyMpinRes = await verifyMpin(verifyMpinReq);
    const verifyMpinJson = await verifyMpinRes.json();
    assert.strictEqual(verifyMpinRes.status, 200, `Expected 200, got ${verifyMpinRes.status}`);
    assert.ok(verifyMpinJson.authToken, "Verify MPIN must yield authToken");
    authToken = verifyMpinJson.authToken;
    console.log("   ✅ MPIN verified, fresh authToken obtained.");

    // ==========================================
    // 5. Token Refresh
    // ==========================================
    console.log("5. Testing Refresh Token (POST /api/v1/customer/refresh)...");
    const refreshReq = makeReq("http://localhost:3000/api/v1/customer/refresh", {
      method: "POST",
      body: {
        refreshToken,
        mpin: testMpin,
      },
    });
    const refreshRes = await refreshAuthToken(refreshReq);
    const refreshJson = await refreshRes.json();
    assert.strictEqual(refreshRes.status, 200, `Expected 200, got ${refreshRes.status}`);
    assert.ok(refreshJson.authToken, "Refresh route must yield renewed authToken");
    authToken = refreshJson.authToken;
    console.log("   ✅ Refresh token valid, new authToken issued.");

    // ==========================================
    // 6. Profile Route (with DB Customer Validation)
    // ==========================================
    console.log("6. Testing Profile (GET /api/v1/customer/profile)...");
    const profReq = makeReq("http://localhost:3000/api/v1/customer/profile", {
      method: "GET",
      token: authToken,
    });
    const profRes = await getCustomerProfile(profReq);
    const profJson = await profRes.json();
    assert.strictEqual(profRes.status, 200, `Expected 200, got ${profRes.status}`);
    assert.strictEqual(profJson.customer.email, testEmail);
    console.log("   ✅ Profile returned customer details matching DB.");

    // ==========================================
    // 7. Order Initialization (imageUrl only + order_screenshots)
    // ==========================================
    console.log("7. Testing Order Initialization (POST /api/v1/customer/orders/initialize)...");

    // 7a. Test oversized image rejection (> 110KB)
    const oversizedBase64 = `data:image/webp;base64,${Buffer.alloc(120 * 1024, 0x41).toString("base64")}`;
    const oversizeInitReq = makeReq("http://localhost:3000/api/v1/customer/orders/initialize", {
      method: "POST",
      token: authToken,
      body: {
        imageUrl: oversizedBase64,
      },
    });
    const oversizeInitRes = await initCustomerOrder(oversizeInitReq);
    const oversizeInitJson = await oversizeInitRes.json();
    assert.strictEqual(oversizeInitRes.status, 400, "Oversized image attachment (>110KB) must be rejected with 400");
    assert.strictEqual(oversizeInitJson.error, "ImagePayloadTooLarge", "Error code must be ImagePayloadTooLarge");
    console.log("   ✅ Oversized customer image guard (>110KB) rejected with 400 ImagePayloadTooLarge.");

    const initReq = makeReq("http://localhost:3000/api/v1/customer/orders/initialize", {
      method: "POST",
      token: authToken,
      body: {
        imageUrl: "https://example.com/receipt.jpg",
      },
    });
    const initRes = await initCustomerOrder(initReq);
    const initJson = await initRes.json();
    assert.strictEqual(initRes.status, 201, `Expected 201, got ${initRes.status}: ${JSON.stringify(initJson)}`);
    assert.ok(initJson.orderId, "orderId must be returned");
    assert.ok(initJson.ticketCode, "ticketCode must be returned");
    createdOrderId = initJson.orderId;

    const initializedOrderRow = await db.query.orders.findFirst({
      where: eq(orders.id, createdOrderId),
    });
    assert.ok(initializedOrderRow, "Order row must exist in DB");
    assert.strictEqual(initializedOrderRow.trackingId, null, "trackingId must be null on initialization");
    assert.strictEqual(initializedOrderRow.status, "PENDING_INITIALIZATION");
    assert.strictEqual(initializedOrderRow.isRefunded, false);

    const screenshotRow = await db.query.orderScreenshots.findFirst({
      where: eq(orderScreenshots.orderId, createdOrderId),
    });
    assert.ok(screenshotRow, "Linked order_screenshots row must be created on initialization");
    assert.strictEqual(screenshotRow.imageUrl, "https://example.com/receipt.jpg");
    assert.strictEqual(screenshotRow.isVerified, false);
    console.log(`   ✅ Order & screenshot initialized in DB. Order ID: ${createdOrderId}, Ticket: ${initJson.ticketCode}`);

    // ==========================================
    // 8. List Orders
    // ==========================================
    console.log("8. Testing List Orders (GET /api/v1/customer/orders)...");
    const listReq = makeReq("http://localhost:3000/api/v1/customer/orders", {
      method: "GET",
      token: authToken,
    });
    const listRes = await listCustomerOrders(listReq);
    const listJson = await listRes.json();
    assert.strictEqual(listRes.status, 200, `Expected 200, got ${listRes.status}`);
    assert.ok(Array.isArray(listJson.orders), "orders must be an array");
    const foundOrder = listJson.orders.find((o: { id: string }) => o.id === createdOrderId);
    assert.ok(foundOrder, "Newly created order must be in customer order list");
    assert.strictEqual((foundOrder as any).imageUrl, undefined, "Customer list orders must omit imageUrl");
    assert.strictEqual((foundOrder as any).proofImageUrl, undefined, "Customer list orders must omit proofImageUrl");
    console.log(`   ✅ Orders listed. Found ${listJson.orders.length} order(s). Images omitted from general list.`);

    // ==========================================
    // 9. Get Single Order by ID
    // ==========================================
    console.log("9. Testing Get Order by ID (GET /api/v1/customer/orders/[id])...");
    const getOrderReq = makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}`, {
      method: "GET",
      token: authToken,
    });
    const getOrderRes = await getCustomerOrder(getOrderReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    const getOrderJson = await getOrderRes.json();
    assert.strictEqual(getOrderRes.status, 200, `Expected 200, got ${getOrderRes.status}`);
    assert.strictEqual(getOrderJson.order.id, createdOrderId);
    assert.strictEqual(getOrderJson.order.trackingId, null);
    assert.strictEqual(getOrderJson.order.imageUrl, undefined, "Customer order detail must omit imageUrl");
    assert.strictEqual(getOrderJson.order.proofImageUrl, undefined, "Customer order detail must omit proofImageUrl");
    console.log("   ✅ Single order retrieved and ownership verified. Images omitted from detail response.");

    // ==========================================
    // 9b. One-Shot Order Continuation (PUT /api/v1/customer/orders/[id])
    // ==========================================
    console.log("9b. Testing Order Continuation (PUT /api/v1/customer/orders/[id])...");

    // Missing required fields must fail with 400
    const badPutReq = makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}`, {
      method: "PUT",
      token: authToken,
      body: {
        order: {
          trackingId: trackingNumber,
          productName: "Test Parcel",
          recipientName: "Test Recipient",
          price: -5,
        },
      },
    });
    const badPutRes = await updateCustomerOrder(badPutReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    assert.strictEqual(badPutRes.status, 400, "Negative price must be rejected with 400");

    // AI_VERIFICATION=true gate must block unverified screenshot with 403
    const prevAiVerification = process.env.AI_VERIFICATION;
    process.env.AI_VERIFICATION = "true";
    const blockedAiReq = makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}`, {
      method: "PUT",
      token: authToken,
      body: {
        order: {
          trackingId: trackingNumber,
          productName: "Test Parcel",
          recipientName: "Test Recipient",
          price: 350,
        },
      },
    });
    const blockedAiRes = await updateCustomerOrder(blockedAiReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    assert.strictEqual(blockedAiRes.status, 403, "AI_VERIFICATION=true must reject unverified screenshot");
    process.env.AI_VERIFICATION = prevAiVerification ?? "false";

    // Valid one-shot PUT transitions PENDING_INITIALIZATION -> PAYMENT_REQUIRED
    const putReq = makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}`, {
      method: "PUT",
      token: authToken,
      body: {
        order: {
          trackingId: trackingNumber,
          productName: "Test Parcel",
          recipientName: "Test Recipient",
          price: 350,
        },
      },
    });
    const putRes = await updateCustomerOrder(putReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    const putJson = await putRes.json();
    assert.strictEqual(putRes.status, 200, `Expected 200, got ${putRes.status}: ${JSON.stringify(putJson)}`);

    const updatedOrderRow = await db.query.orders.findFirst({
      where: eq(orders.id, createdOrderId),
    });
    assert.strictEqual(updatedOrderRow?.status, "PAYMENT_REQUIRED");
    assert.strictEqual(updatedOrderRow?.trackingId, trackingNumber);
    assert.strictEqual(updatedOrderRow?.price, 350);

    // Calling PUT a second time on PAYMENT_REQUIRED must be rejected with 400
    const secondPutRes = await updateCustomerOrder(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}`, {
        method: "PUT",
        token: authToken,
        body: {
          order: {
            trackingId: trackingNumber,
            productName: "Changed Parcel",
            recipientName: "Test Recipient",
            price: 400,
          },
        },
      }),
      { params: Promise.resolve({ id: createdOrderId }) }
    );
    assert.strictEqual(secondPutRes.status, 400, "Second PUT on PAYMENT_REQUIRED must be rejected");

    // Paid vs Unpaid trackingId lock checks:
    // 1) Unpaid PAYMENT_REQUIRED order does NOT lock trackingNumber
    const init2Res = await initCustomerOrder(
      makeReq("http://localhost:3000/api/v1/customer/orders/initialize", {
        method: "POST",
        token: authToken,
        body: { imageUrl: "https://example.com/receipt-2.jpg" },
      })
    );
    const init2Json = await init2Res.json();
    secondOrderId = init2Json.orderId;
    const unpaidDupPutRes = await updateCustomerOrder(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${secondOrderId}`, {
        method: "PUT",
        token: authToken,
        body: {
          order: {
            trackingId: trackingNumber,
            productName: "Unpaid Dup",
            recipientName: "Test Recipient",
            price: 100,
          },
        },
      }),
      { params: Promise.resolve({ id: secondOrderId }) }
    );
    assert.strictEqual(unpaidDupPutRes.status, 200, "Unpaid PAYMENT_REQUIRED must not lock trackingId");

    // 2) Paid AWAITING_PARCEL order DOES lock trackingNumber (409)
    await db
      .update(orders)
      .set({ status: "AWAITING_PARCEL" })
      .where(eq(orders.id, secondOrderId));

    const init3Res = await initCustomerOrder(
      makeReq("http://localhost:3000/api/v1/customer/orders/initialize", {
        method: "POST",
        token: authToken,
        body: { imageUrl: "https://example.com/receipt-3.jpg" },
      })
    );
    const init3Json = await init3Res.json();
    thirdOrderId = init3Json.orderId;
    const paidDupPutRes = await updateCustomerOrder(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${thirdOrderId}`, {
        method: "PUT",
        token: authToken,
        body: {
          order: {
            trackingId: trackingNumber,
            productName: "Paid Dup",
            recipientName: "Test Recipient",
            price: 200,
          },
        },
      }),
      { params: Promise.resolve({ id: thirdOrderId }) }
    );
    assert.strictEqual(paidDupPutRes.status, 409, "Paid AWAITING_PARCEL order must lock trackingId with 409");

    // 3) CANCELLED order releases trackingNumber so it can be reused
    await db
      .update(orders)
      .set({ status: "CANCELLED" })
      .where(eq(orders.id, secondOrderId));

    const cancelledReusePutRes = await updateCustomerOrder(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${thirdOrderId}`, {
        method: "PUT",
        token: authToken,
        body: {
          order: {
            trackingId: trackingNumber,
            productName: "Reused After Cancel",
            recipientName: "Test Recipient",
            price: 200,
          },
        },
      }),
      { params: Promise.resolve({ id: thirdOrderId }) }
    );
    assert.strictEqual(cancelledReusePutRes.status, 200, "CANCELLED order must release trackingId");
    console.log("   ✅ One-shot PUT, AI_VERIFICATION gate, and paid trackingId lock checks passed.");

    // ==========================================
    // 9c. Dedicated Order Photo Retrieval (GET /api/v1/customer/orders/[id]/photo)
    // ==========================================
    console.log("9c. Testing Order Photo Retrieval (GET /api/v1/customer/orders/[id]/photo)...");

    // Unauthorized without token -> 401
    const unauthPhotoRes = await getCustomerOrderPhoto(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}/photo`),
      { params: Promise.resolve({ id: createdOrderId }) }
    );
    assert.strictEqual(unauthPhotoRes.status, 401, "Missing token on photo route must return 401");

    // Invalid type filter -> 400
    const invalidTypePhotoRes = await getCustomerOrderPhoto(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}/photo?type=INVALID`, {
        token: authToken,
      }),
      { params: Promise.resolve({ id: createdOrderId }) }
    );
    assert.strictEqual(invalidTypePhotoRes.status, 400, "Invalid type filter on photo route must return 400");

    // Non-existent order -> 404
    const notFoundPhotoRes = await getCustomerOrderPhoto(
      makeReq(`http://localhost:3000/api/v1/customer/orders/ORD-NONEXISTENT/photo`, {
        token: authToken,
      }),
      { params: Promise.resolve({ id: "ORD-NONEXISTENT" }) }
    );
    assert.strictEqual(notFoundPhotoRes.status, 404, "Non-existent order on photo route must return 404");

    // Default (type=all): returns both screenshot and proof
    const defaultPhotoRes = await getCustomerOrderPhoto(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}/photo`, {
        token: authToken,
      }),
      { params: Promise.resolve({ id: createdOrderId }) }
    );
    assert.strictEqual(defaultPhotoRes.status, 200);
    const defaultPhotoJson = await defaultPhotoRes.json();
    assert.strictEqual(defaultPhotoJson.orderId, createdOrderId);
    assert.strictEqual(defaultPhotoJson.imageUrl, "https://example.com/receipt.jpg");
    assert.strictEqual(defaultPhotoJson.proofImageUrl, null);

    // Filter type=screenshot: returns screenshot, proof is null
    const screenshotPhotoRes = await getCustomerOrderPhoto(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}/photo?type=screenshot`, {
        token: authToken,
      }),
      { params: Promise.resolve({ id: createdOrderId }) }
    );
    assert.strictEqual(screenshotPhotoRes.status, 200);
    const screenshotPhotoJson = await screenshotPhotoRes.json();
    assert.strictEqual(screenshotPhotoJson.imageUrl, "https://example.com/receipt.jpg");
    assert.strictEqual(screenshotPhotoJson.proofImageUrl, null);

    // Filter type=proof: screenshot is null, proof is null (not yet uploaded)
    const proofPhotoRes = await getCustomerOrderPhoto(
      makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}/photo?type=proof`, {
        token: authToken,
      }),
      { params: Promise.resolve({ id: createdOrderId }) }
    );
    assert.strictEqual(proofPhotoRes.status, 200);
    const proofPhotoJson = await proofPhotoRes.json();
    assert.strictEqual(proofPhotoJson.imageUrl, null);
    assert.strictEqual(proofPhotoJson.proofImageUrl, null);
    console.log("   ✅ Customer order photo retrieval (default, screenshot, proof, 400, 401, 404 guards) verified.");

    // ==========================================
    // 10. Claim Order (Status Check Guard)
    // ==========================================
    console.log("10. Testing Claim Order Status Check (POST /api/v1/customer/orders/[id]/claim)...");
    const claimReq = makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}/claim`, {
      method: "POST",
      token: authToken,
    });
    const claimRes = await claimCustomerOrder(claimReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    // Order is currently in PAYMENT_REQUIRED status, so claiming should be rejected with 400
    assert.strictEqual(claimRes.status, 400, "Should reject claiming an order not in READY_TO_CLAIM status");
    console.log("   ✅ Claim correctly rejected when order is not in READY_TO_CLAIM state.");

    // Update status to READY_TO_CLAIM to test successful claim
    await db
      .update(orders)
      .set({ status: "READY_TO_CLAIM" })
      .where(eq(orders.id, createdOrderId));

    const claimValidRes = await claimCustomerOrder(claimReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    const claimValidJson = await claimValidRes.json();
    assert.strictEqual(claimValidRes.status, 200, `Expected 200, got ${claimValidRes.status}`);
    assert.ok(claimValidJson.claimInitiatedAt, "claimInitiatedAt should be set");
    assert.ok(claimValidJson.claimExpiresAt, "claimExpiresAt should be set");
    console.log("   ✅ Claim initiated successfully when order is READY_TO_CLAIM.");

    // ==========================================
    // 11. Selective Blacklist Enforcement Test
    // ==========================================
    console.log("11. Testing Blacklist Isolation Behavior...");
    // Blacklist the customer
    await db
      .update(customers)
      .set({ blacklisted: true, blacklistReason: "Test policy violation" })
      .where(eq(customers.id, customerId));

    // A) Blacklisted customer CANNOT initialize new order
    const blockedInitReq = makeReq("http://localhost:3000/api/v1/customer/orders/initialize", {
      method: "POST",
      token: authToken,
      body: {
        imageUrl: "https://example.com/receipt2.jpg",
      },
    });
    const blockedInitRes = await initCustomerOrder(blockedInitReq);
    assert.strictEqual(blockedInitRes.status, 403, "Blacklisted customer must be rejected with 403 from initializing orders");
    console.log("   ✅ Blacklisted customer successfully blocked from initializing new orders (403).");

    // B) Blacklisted customer CAN still view and claim their existing orders (preventing staff hijacking)
    const viewOrderReq = makeReq(`http://localhost:3000/api/v1/customer/orders/${createdOrderId}`, {
      method: "GET",
      token: authToken,
    });
    const viewOrderRes = await getCustomerOrder(viewOrderReq, {
      params: Promise.resolve({ id: createdOrderId }),
    });
    assert.strictEqual(viewOrderRes.status, 200, "Blacklisted customer must still be able to view their existing orders");
    console.log("   ✅ Blacklisted customer can still view their existing orders.");

    console.log("\n🎉 ALL V1 CUSTOMER ROUTE CHECKS PASSED!");
  } finally {
    // ==========================================
    // Clean Up Test Data
    // ==========================================
    console.log("\n🧹 Cleaning up test database records...");
    if (thirdOrderId) {
      await db.delete(orders).where(eq(orders.id, thirdOrderId));
    }
    if (secondOrderId) {
      await db.delete(orders).where(eq(orders.id, secondOrderId));
    }
    if (createdOrderId) {
      await db.delete(orders).where(eq(orders.id, createdOrderId));
    }
    if (customerId) {
      await db.delete(customers).where(eq(customers.id, customerId));
    } else if (testEmail) {
      await db.delete(customers).where(eq(customers.email, testEmail));
    }
    console.log("   ✅ Database cleaned up.");
    process.exit(0);
  }
}

runV1CustomerTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
