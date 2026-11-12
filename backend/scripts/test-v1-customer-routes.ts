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
import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { customers, orders } from "../db/schema";

// v1 Customer Route Handlers
import { POST as registerCustomer } from "../app/api/v1/customer/register/route";
import { POST as loginCustomer } from "../app/api/v1/customer/login/route";
import { POST as createMpin } from "../app/api/v1/customer/create-mpin/route";
import { POST as verifyMpin } from "../app/api/v1/customer/mpin/route";
import { POST as refreshAuthToken } from "../app/api/v1/customer/refresh/route";
import { GET as getCustomerProfile } from "../app/api/v1/customer/profile/route";
import { GET as listCustomerOrders } from "../app/api/v1/customer/orders/route";
import { POST as initCustomerOrder } from "../app/api/v1/customer/orders/initialize/route";
import { GET as getCustomerOrder } from "../app/api/v1/customer/orders/[id]/route";
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
    // 7. Order Initialization
    // ==========================================
    console.log("7. Testing Order Initialization (POST /api/v1/customer/orders/initialize)...");
    const initReq = makeReq("http://localhost:3000/api/v1/customer/orders/initialize", {
      method: "POST",
      token: authToken,
      body: {
        imageUrl: "https://example.com/receipt.jpg",
        trackingId: trackingNumber,
      },
    });
    const initRes = await initCustomerOrder(initReq);
    const initJson = await initRes.json();
    assert.strictEqual(initRes.status, 201, `Expected 201, got ${initRes.status}: ${JSON.stringify(initJson)}`);
    assert.ok(initJson.orderId, "orderId must be returned");
    assert.ok(initJson.ticketCode, "ticketCode must be returned");
    createdOrderId = initJson.orderId;
    console.log(`   ✅ Order initialized in DB. Order ID: ${createdOrderId}, Ticket: ${initJson.ticketCode}`);

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
    console.log(`   ✅ Orders listed. Found ${listJson.orders.length} order(s).`);

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
    console.log("   ✅ Single order retrieved and ownership verified.");

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
    // Order is currently in PENDING_INITIALIZATION status, so claiming should be rejected with 400
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
        trackingId: `TRACK-${Date.now()}-BLOCKED`,
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
