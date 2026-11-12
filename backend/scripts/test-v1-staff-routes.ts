import assert from "node:assert";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function req(path: string, options: { method?: string; body?: unknown; token?: string } = {}) {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runV1StaffSuite() {
  console.log(`🚀 Starting V1 Staff API Test Suite against ${BASE_URL}...\n`);

  let authToken = "";

  // 1. Invalid Login
  console.log("1. Testing Invalid Login (POST /api/v1/staff/login)...");
  const badLogin = await req("/api/v1/staff/login", {
    method: "POST",
    body: { username: "staff", password: "wrongpassword" },
  });
  assert.strictEqual(badLogin.status, 401, "Should reject wrong password with 401");
  console.log("   ✅ Wrong password rejected with 401 Unauthorized.");

  // 2. Successful Login
  console.log("\n2. Testing Successful Login (POST /api/v1/staff/login)...");
  const goodLogin = await req("/api/v1/staff/login", {
    method: "POST",
    body: { username: "staff", password: "string" },
  });
  assert.strictEqual(goodLogin.status, 200, "Valid credentials should return 200 OK");
  assert.ok(goodLogin.data.authToken, "Must receive authToken");
  assert.ok(goodLogin.data.refreshToken, "Must receive refreshToken");
  authToken = goodLogin.data.authToken;
  console.log("   ✅ Staff login successful. Received indefinite authToken & refreshToken.");

  // 3. List Orders (Auth Guard)
  console.log("\n3. Testing List Orders Guard (GET /api/v1/staff/orders)...");
  const unauthList = await req("/api/v1/staff/orders");
  assert.strictEqual(unauthList.status, 401, "Missing token should return 401");
  console.log("   ✅ Missing bearer token rejected with 401.");

  // 4. List Orders (Success)
  console.log("\n4. Testing List Orders (GET /api/v1/staff/orders)...");
  const authList = await req("/api/v1/staff/orders?limit=10", { token: authToken });
  assert.strictEqual(authList.status, 200, "Authorized list should return 200");
  assert.ok(Array.isArray(authList.data.orders), "orders must be array");
  assert.ok(authList.data.pagination, "pagination metadata must be returned");
  console.log(`   ✅ Orders listed (${authList.data.orders.length} orders returned, totalCount: ${authList.data.pagination.totalCount}).`);

  // 5. Lookup Order by ID & TicketCode
  console.log("\n5. Testing View Order Details by ID and TicketCode...");
  const orderId = "ORD-C1-PAY-01";
  const ticketCode = "101-201";

  const byId = await req(`/api/v1/staff/orders/${orderId}`, { token: authToken });
  assert.strictEqual(byId.status, 200);
  assert.strictEqual(byId.data.orderId, orderId);
  console.log("   ✅ Order retrieved by ID successfully.");

  const byCode = await req(`/api/v1/staff/orders/${ticketCode}`, { token: authToken });
  assert.strictEqual(byCode.status, 200);
  assert.strictEqual(byCode.data.orderId, orderId);
  console.log("   ✅ Order retrieved by human ticket code successfully.");

  // 6. Activate Order (Underpayment Guard & Success)
  console.log("\n6. Testing Order Activation (POST /api/v1/staff/orders/[id]/activate)...");
  const underpay = await req(`/api/v1/staff/orders/${orderId}/activate`, {
    method: "POST",
    token: authToken,
    body: { amountReceived: 100 }, // price is 480
  });
  assert.strictEqual(underpay.status, 400);
  console.log("   ✅ Underpayment rejected with 400 Bad Request.");

  const activate = await req(`/api/v1/staff/orders/${orderId}/activate`, {
    method: "POST",
    token: authToken,
    body: { amountReceived: 500 }, // Change = 20
  });
  assert.strictEqual(activate.status, 200);
  assert.strictEqual(activate.data.change, 20);
  console.log("   ✅ Order activated successfully. Status transitioned to AWAITING_PARCEL.");

  // 7. Pay Courier (POST .../make-claimable/pay)
  console.log("\n7. Testing Courier Payment (POST /api/v1/staff/orders/[id]/make-claimable/pay)...");
  const pay = await req(`/api/v1/staff/orders/${orderId}/make-claimable/pay`, {
    method: "POST",
    token: authToken,
  });
  assert.strictEqual(pay.status, 200);
  console.log("   ✅ Courier payment recorded successfully.");

  const doublePay = await req(`/api/v1/staff/orders/${orderId}/make-claimable/pay`, {
    method: "POST",
    token: authToken,
  });
  assert.strictEqual(doublePay.status, 400);
  console.log("   ✅ Duplicate courier payment prevented with 400 Bad Request.");

  // 8. Attach Proof Photo (POST .../make-claimable/attach-photo)
  console.log("\n8. Testing Proof Photo (POST /api/v1/staff/orders/[id]/make-claimable/attach-photo)...");
  const photo = await req(`/api/v1/staff/orders/${orderId}/make-claimable/attach-photo`, {
    method: "POST",
    token: authToken,
    body: { imageUrl: "https://storage.parcelhub.com/proof/test.jpg" },
  });
  assert.strictEqual(photo.status, 200);
  console.log("   ✅ Proof photo attached. Status transitioned to READY_TO_CLAIM.");

  // 9. Claim Order (Guards)
  console.log("\n9. Testing Claim Order Guards (POST /api/v1/staff/orders/[id]/claim)...");
  const uninitiated = await req(`/api/v1/staff/orders/${orderId}/claim`, {
    method: "POST",
    token: authToken,
  });
  assert.strictEqual(uninitiated.status, 403);
  console.log("   ✅ Releasing parcel rejected (403) before customer initiates claim pass.");

  console.log("\n🎉 ALL V1 STAFF API TESTS PASSED SUCCESSFULLY (100% GREEN)!\n");
}

runV1StaffSuite().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
