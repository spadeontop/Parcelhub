import { NextRequest } from "next/server";
import assert from "node:assert";

// Customer Handlers
import { POST as registerCustomer } from "../app/api/customer/register/route";
import { POST as loginCustomer } from "../app/api/customer/login/route";
import { POST as createMpin } from "../app/api/customer/create-mpin/route";
import { POST as verifyMpin } from "../app/api/customer/mpin/route";
import { GET as listCustomerOrders } from "../app/api/customer/orders/route";
import { POST as initCustomerOrder } from "../app/api/customer/orders/initialize/route";
import {
  GET as getCustomerOrder,
  PUT as updateCustomerOrder,
  DELETE as cancelCustomerOrder,
} from "../app/api/customer/orders/[id]/route";
import { POST as customerClaimOrder } from "../app/api/customer/orders/[id]/claim/route";

// Staff Handlers
import { POST as loginStaff } from "../app/api/staff/login/route";
import { GET as listStaffOrders } from "../app/api/staff/orders/route";
import { GET as getStaffOrder } from "../app/api/staff/orders/[id]/route";
import { POST as activateOrder } from "../app/api/staff/orders/[id]/activate/route";
import { POST as payCourier } from "../app/api/staff/orders/[id]/make-claimable/pay/route";
import { POST as attachPhoto } from "../app/api/staff/orders/[id]/make-claimable/attach-photo/route";
import { POST as staffClaimOrder } from "../app/api/staff/orders/[id]/claim/route";

// Admin Handlers
import { POST as createStaff } from "../app/api/admin/create-staff/route";
import { GET as listStaffs } from "../app/api/admin/staffs/route";
import {
  PUT as updateStaff,
  DELETE as deleteStaff,
} from "../app/api/admin/staffs/[id]/route";
import { GET as listAdminOrders } from "../app/api/admin/orders/route";
import { GET as getAdminOrderAudit } from "../app/api/admin/orders/[id]/route";
import { POST as blacklistCustomer } from "../app/api/admin/blacklist/customer/[id]/route";
import { POST as setOcrConfig } from "../app/api/admin/config/[target]/ai-ocr-verify/[action]/route";

// Notification Handlers
import { POST as uploadFcmToken } from "../app/api/notification/upload-token/route";
import { POST as sendNotification } from "../app/api/notification/send-notification/route";

function makeReq(url: string, options: { method?: string; body?: unknown; token?: string } = {}) {
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

async function runTests() {
  console.log("🚀 Starting ParcelHub API Routes Verification...\n");

  // ==========================================
  // 1. Customer Flow
  // ==========================================
  console.log("--- Testing Customer Endpoints ---");

  // 1.1 Register
  const regReq = makeReq("http://localhost:3000/api/customer/register", {
    method: "POST",
    body: {
      email: "alice@example.com",
      password: "securepassword",
      firstName: "Alice",
      lastName: "Wonderland",
      phoneNumber: "+639111222333",
    },
  });
  const regRes = await registerCustomer(regReq);
  const regJson = await regRes.json();
  assert.strictEqual(regRes.status, 201);
  assert.ok(regJson.preAuthToken, "preAuthToken must be returned on register");
  console.log("✔ POST /api/customer/register (201 Created)");

  // 1.2 Create MPIN
  const createMpinReq = makeReq("http://localhost:3000/api/customer/create-mpin", {
    method: "POST",
    body: {
      preAuthToken: regJson.preAuthToken,
      mpin: "5678",
    },
  });
  const createMpinRes = await createMpin(createMpinReq);
  const createMpinJson = await createMpinRes.json();
  assert.strictEqual(createMpinRes.status, 200);
  assert.ok(createMpinJson.authToken, "authToken must be returned");
  assert.ok(createMpinJson.refreshToken, "refreshToken must be returned");
  console.log("✔ POST /api/customer/create-mpin (200 OK)");

  // 1.3 Login with existing seed customer
  const loginReq = makeReq("http://localhost:3000/api/customer/login", {
    method: "POST",
    body: {
      email: "user@example.com",
      password: "password",
    },
  });
  const loginRes = await loginCustomer(loginReq);
  const loginJson = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginJson.preAuthToken, "preAuthToken must be returned on login");
  console.log("✔ POST /api/customer/login (200 OK)");

  // 1.4 Verify MPIN for seed customer
  const verifyMpinReq = makeReq("http://localhost:3000/api/customer/mpin", {
    method: "POST",
    body: {
      preAuthToken: loginJson.preAuthToken,
      mpin: "1234",
    },
  });
  const verifyMpinRes = await verifyMpin(verifyMpinReq);
  const verifyMpinJson = await verifyMpinRes.json();
  assert.strictEqual(verifyMpinRes.status, 200);
  const customerAuthToken = verifyMpinJson.authToken;
  assert.ok(customerAuthToken);
  console.log("✔ POST /api/customer/mpin (200 OK)");

  // 1.5 List Customer Orders
  const listOrdersReq = makeReq("http://localhost:3000/api/customer/orders", {
    token: customerAuthToken,
  });
  const listOrdersRes = await listCustomerOrders(listOrdersReq);
  const listOrdersJson = await listOrdersRes.json();
  assert.strictEqual(listOrdersRes.status, 200);
  assert.ok(Array.isArray(listOrdersJson.orders));
  console.log(`✔ GET /api/customer/orders (200 OK, retrieved ${listOrdersJson.orders.length} orders)`);

  // 1.5b Customer Orders Pagination & Clamp Tests
  const paginatedCustomerReq = makeReq("http://localhost:3000/api/customer/orders?limit=2&offset=1", {
    token: customerAuthToken,
  });
  const paginatedCustomerRes = await listCustomerOrders(paginatedCustomerReq);
  const paginatedCustomerJson = await paginatedCustomerRes.json();
  assert.strictEqual(paginatedCustomerRes.status, 200);
  assert.strictEqual(paginatedCustomerJson.orders.length, 2);
  assert.strictEqual(paginatedCustomerJson.orders[0].id, listOrdersJson.orders[1].id);
  console.log("✔ GET /api/customer/orders pagination limit & offset verified");

  const clampedCustomerReq = makeReq("http://localhost:3000/api/customer/orders?limit=999", {
    token: customerAuthToken,
  });
  const clampedCustomerRes = await listCustomerOrders(clampedCustomerReq);
  const clampedCustomerJson = await clampedCustomerRes.json();
  assert.strictEqual(clampedCustomerRes.status, 200);
  assert.ok(clampedCustomerJson.orders.length <= 100);
  console.log("✔ GET /api/customer/orders pagination max clamp verified");

  // 1.6 Initialize Order
  const initOrderReq = makeReq("http://localhost:3000/api/customer/orders/initialize", {
    method: "POST",
    token: customerAuthToken,
    body: { imageUrl: "https://storage.parcelhub.com/receipts/receipt-001.jpg" },
  });
  const initOrderRes = await initCustomerOrder(initOrderReq);
  const initOrderJson = await initOrderRes.json();
  assert.strictEqual(initOrderRes.status, 201);
  const newOrderId = initOrderJson.orderId;
  assert.ok(newOrderId);
  console.log(`✔ POST /api/customer/orders/initialize (201 Created, orderId: ${newOrderId})`);

  // 1.7 Get Customer Order
  const getOrderReq = makeReq(`http://localhost:3000/api/customer/orders/${newOrderId}`, {
    token: customerAuthToken,
  });
  const getOrderRes = await getCustomerOrder(getOrderReq, { params: Promise.resolve({ id: newOrderId }) });
  const getOrderJson = await getOrderRes.json();
  assert.strictEqual(getOrderRes.status, 200);
  assert.strictEqual(getOrderJson.order.id, newOrderId);
  console.log(`✔ GET /api/customer/orders/{id} (200 OK)`);

  // 1.8 Update Customer Order
  const updateOrderReq = makeReq(`http://localhost:3000/api/customer/orders/${newOrderId}`, {
    method: "PUT",
    token: customerAuthToken,
    body: {
      order: {
        productName: "Logitech MX Master 3S",
        price: 520,
      },
    },
  });
  const updateOrderRes = await updateCustomerOrder(updateOrderReq, { params: Promise.resolve({ id: newOrderId }) });
  assert.strictEqual(updateOrderRes.status, 200);
  console.log(`✔ PUT /api/customer/orders/{id} (200 OK)`);

  // 1.8b Reject duplicate active tracking ID
  const duplicateTrackingReq = makeReq(`http://localhost:3000/api/customer/orders/${newOrderId}`, {
    method: "PUT",
    token: customerAuthToken,
    body: {
      order: {
        trackingId: "PH-PEND-001", // Already active
      },
    },
  });
  const duplicateTrackingRes = await updateCustomerOrder(duplicateTrackingReq, { params: Promise.resolve({ id: newOrderId }) });
  assert.strictEqual(duplicateTrackingRes.status, 409);
  console.log("✔ PUT /api/customer/orders/{id} rejected duplicate active tracking ID (409 DuplicateTrackingId)");

  // 1.8b Verify Edit Guard: Cannot edit once order is paid / not unpaid
  // We test editing an active/claimable order (ORD-402 is READY_TO_CLAIM)
  const rejectEditReq = makeReq("http://localhost:3000/api/customer/orders/ORD-402", {
    method: "PUT",
    token: customerAuthToken,
    body: { order: { productName: "Hacked Update" } },
  });
  const rejectEditRes = await updateCustomerOrder(rejectEditReq, { params: Promise.resolve({ id: "ORD-402" }) });
  assert.strictEqual(rejectEditRes.status, 400);
  console.log("✔ PUT /api/customer/orders/{id} rejected for non-unpaid order (400 OrderNotEditable)");

  // 1.9 Claim Order (using ORD-402 which is READY_TO_CLAIM)
  const claimOrderReq = makeReq("http://localhost:3000/api/customer/orders/ORD-402/claim", {
    method: "POST",
    token: customerAuthToken,
    body: {},
  });
  const claimOrderRes = await customerClaimOrder(claimOrderReq, { params: Promise.resolve({ id: "ORD-402" }) });
  assert.strictEqual(claimOrderRes.status, 200);
  console.log("✔ POST /api/customer/orders/{id}/claim (200 OK)");

  // 1.10 Cancel Customer Order
  const cancelOrderReq = makeReq(`http://localhost:3000/api/customer/orders/${newOrderId}`, {
    method: "DELETE",
    token: customerAuthToken,
  });
  const cancelOrderRes = await cancelCustomerOrder(cancelOrderReq, { params: Promise.resolve({ id: newOrderId }) });
  assert.strictEqual(cancelOrderRes.status, 200);
  console.log(`✔ DELETE /api/customer/orders/{id} (200 OK)`);

  // ==========================================
  // 2. Staff Flow
  // ==========================================
  console.log("\n--- Testing Staff Endpoints ---");

  // 2.1 Staff Login
  const staffLoginReq = makeReq("http://localhost:3000/api/staff/login", {
    method: "POST",
    body: {
      email: "staff@parcelhub.com",
      password: "string",
    },
  });
  const staffLoginRes = await loginStaff(staffLoginReq);
  const staffLoginJson = await staffLoginRes.json();
  assert.strictEqual(staffLoginRes.status, 200);
  const staffAuthToken = staffLoginJson.authToken;
  assert.ok(staffAuthToken);
  console.log("✔ POST /api/staff/login (200 OK)");

  // 2.2 Staff List Orders
  const staffListReq = makeReq("http://localhost:3000/api/staff/orders", {
    token: staffAuthToken,
  });
  const staffListRes = await listStaffOrders(staffListReq);
  const staffListJson = await staffListRes.json();
  assert.strictEqual(staffListRes.status, 200);
  assert.ok(Array.isArray(staffListJson.orders));
  assert.ok(
    staffListJson.orders.every((o: any) => typeof o.amountToPay === "number"),
    "All orders in staff list must have amountToPay as number"
  );
  console.log(`✔ GET /api/staff/orders (200 OK, retrieved ${staffListJson.orders.length} orders, verified amountToPay)`);

  // 2.2b Staff Orders Pagination & Clamp Tests
  const paginatedStaffReq = makeReq("http://localhost:3000/api/staff/orders?limit=3&offset=2", {
    token: staffAuthToken,
  });
  const paginatedStaffRes = await listStaffOrders(paginatedStaffReq);
  const paginatedStaffJson = await paginatedStaffRes.json();
  assert.strictEqual(paginatedStaffRes.status, 200);
  assert.strictEqual(paginatedStaffJson.orders.length, 3);
  assert.strictEqual(paginatedStaffJson.orders[0].id, staffListJson.orders[2].id);
  console.log("✔ GET /api/staff/orders pagination limit & offset verified");

  const clampedStaffReq = makeReq("http://localhost:3000/api/staff/orders?limit=250", {
    token: staffAuthToken,
  });
  const clampedStaffRes = await listStaffOrders(clampedStaffReq);
  const clampedStaffJson = await clampedStaffRes.json();
  assert.strictEqual(clampedStaffRes.status, 200);
  assert.ok(clampedStaffJson.orders.length <= 100);
  console.log("✔ GET /api/staff/orders pagination max clamp verified");

  // 2.3 Staff Get Order
  const staffGetReq = makeReq("http://localhost:3000/api/staff/orders/ORD-402", {
    token: staffAuthToken,
  });
  const staffGetRes = await getStaffOrder(staffGetReq, { params: Promise.resolve({ id: "ORD-402" }) });
  const staffGetJson = await staffGetRes.json();
  assert.strictEqual(staffGetRes.status, 200);
  assert.strictEqual(staffGetJson.orderId, "ORD-402");
  console.log("✔ GET /api/staff/orders/{id} (200 OK)");

  // 2.4 Staff Activate Order (using an order in PAYMENT_REQUIRED status)
  // Let's create an order in PAYMENT_REQUIRED
  const activateTargetReq = makeReq("http://localhost:3000/api/customer/orders/initialize", {
    method: "POST",
    token: customerAuthToken,
    body: { imageUrl: "https://storage.parcelhub.com/receipts/temp.jpg" },
  });
  const activateTargetRes = await initCustomerOrder(activateTargetReq);
  const { orderId: orderToActivate } = await activateTargetRes.json();
  await updateCustomerOrder(
    makeReq(`http://localhost:3000/api/customer/orders/${orderToActivate}`, {
      method: "PUT",
      token: customerAuthToken,
      body: { order: { price: 300 } },
    }),
    { params: Promise.resolve({ id: orderToActivate }) }
  );

  const activateReq = makeReq(`http://localhost:3000/api/staff/orders/${orderToActivate}/activate`, {
    method: "POST",
    token: staffAuthToken,
    body: { amountReceived: 350 },
  });
  const activateRes = await activateOrder(activateReq, { params: Promise.resolve({ id: orderToActivate }) });
  const activateJson = await activateRes.json();
  assert.strictEqual(activateRes.status, 200);
  assert.strictEqual(activateJson.change, 50);
  console.log(`✔ POST /api/staff/orders/{id}/activate (200 OK, change: ${activateJson.change})`);

  // 2.4b Staff cannot attach photo before courier payout is logged
  const prematureAttachReq = makeReq(`http://localhost:3000/api/staff/orders/${orderToActivate}/make-claimable/attach-photo`, {
    method: "POST",
    token: staffAuthToken,
    body: { imageUrl: "https://storage.parcelhub.com/proof/ORD-pre.jpg" },
  });
  const prematureAttachRes = await attachPhoto(prematureAttachReq, { params: Promise.resolve({ id: orderToActivate }) });
  assert.strictEqual(prematureAttachRes.status, 400);
  console.log("✔ POST /api/staff/orders/{id}/make-claimable/attach-photo rejected when courier not yet paid (400 CourierPaymentRequired)");

  // 2.5 Courier Pay
  const payReq = makeReq(`http://localhost:3000/api/staff/orders/${orderToActivate}/make-claimable/pay`, {
    method: "POST",
    token: staffAuthToken,
    body: {},
  });
  const payRes = await payCourier(payReq, { params: Promise.resolve({ id: orderToActivate }) });
  assert.strictEqual(payRes.status, 200);
  console.log("✔ POST /api/staff/orders/{id}/make-claimable/pay (200 OK)");

  // 2.6 Attach Photo
  const attachPhotoReq = makeReq(`http://localhost:3000/api/staff/orders/${orderToActivate}/make-claimable/attach-photo`, {
    method: "POST",
    token: staffAuthToken,
    body: { imageUrl: "https://storage.parcelhub.com/proof/ORD-402.jpg" },
  });
  const attachPhotoRes = await attachPhoto(attachPhotoReq, { params: Promise.resolve({ id: orderToActivate }) });
  assert.strictEqual(attachPhotoRes.status, 200);
  console.log("✔ POST /api/staff/orders/{id}/make-claimable/attach-photo (200 OK)");

  // 2.6b Customer initiates claim pass (required before staff release)
  await customerClaimOrder(
    makeReq(`http://localhost:3000/api/customer/orders/${orderToActivate}/claim`, {
      method: "POST",
      token: customerAuthToken,
      body: {},
    }),
    { params: Promise.resolve({ id: orderToActivate }) }
  );

  // 2.7 Staff Claim
  const staffClaimReq = makeReq(`http://localhost:3000/api/staff/orders/${orderToActivate}/claim`, {
    method: "POST",
    token: staffAuthToken,
    body: {},
  });
  const staffClaimRes = await staffClaimOrder(staffClaimReq, { params: Promise.resolve({ id: orderToActivate }) });
  assert.strictEqual(staffClaimRes.status, 200);
  console.log("✔ POST /api/staff/orders/{id}/claim (200 OK)");

  // ==========================================
  // 3. Admin Flow
  // ==========================================
  console.log("\n--- Testing Admin Endpoints ---");
  const adminToken = "admin_mock_token";

  // 3.1 Create Staff
  const createStaffReq = makeReq("http://localhost:3000/api/admin/create-staff", {
    method: "POST",
    token: adminToken,
    body: {
      email: "newstaff@parcelhub.com",
      password: "staffpassword",
      firstName: "Bob",
      lastName: "Builder",
      phoneNumber: "+639555666777",
    },
  });
  const createStaffRes = await createStaff(createStaffReq);
  const createStaffJson = await createStaffRes.json();
  assert.strictEqual(createStaffRes.status, 201);
  const createdStaffId = createStaffJson.staffId;
  assert.ok(createdStaffId);
  console.log(`✔ POST /api/admin/create-staff (201 Created, staffId: ${createdStaffId})`);

  // 3.2 List Staff
  const listStaffReq = makeReq("http://localhost:3000/api/admin/staffs", {
    token: adminToken,
  });
  const listStaffRes = await listStaffs(listStaffReq);
  const listStaffJson = await listStaffRes.json();
  assert.strictEqual(listStaffRes.status, 200);
  assert.ok(listStaffJson.staffs.length >= 2);
  console.log(`✔ GET /api/admin/staffs (200 OK, retrieved ${listStaffJson.staffs.length} staff)`);

  // 3.3 Update Staff
  const updateStaffReq = makeReq(`http://localhost:3000/api/admin/staffs/${createdStaffId}`, {
    method: "PUT",
    token: adminToken,
    body: {
      staff: {
        firstName: "Robert",
      },
    },
  });
  const updateStaffRes = await updateStaff(updateStaffReq, { params: Promise.resolve({ id: createdStaffId }) });
  assert.strictEqual(updateStaffRes.status, 200);
  console.log(`✔ PUT /api/admin/staffs/{id} (200 OK)`);

  // 3.4 Delete Staff
  const deleteStaffReq = makeReq(`http://localhost:3000/api/admin/staffs/${createdStaffId}`, {
    method: "DELETE",
    token: adminToken,
    body: { reason: "Contract ended" },
  });
  const deleteStaffRes = await deleteStaff(deleteStaffReq, { params: Promise.resolve({ id: createdStaffId }) });
  assert.strictEqual(deleteStaffRes.status, 200);
  console.log(`✔ DELETE /api/admin/staffs/{id} (200 OK)`);

  // 3.5 List Audit Orders
  const listAuditOrdersReq = makeReq("http://localhost:3000/api/admin/orders", {
    token: adminToken,
  });
  const listAuditOrdersRes = await listAdminOrders(listAuditOrdersReq);
  const listAuditOrdersJson = await listAuditOrdersRes.json();
  assert.strictEqual(listAuditOrdersRes.status, 200);
  console.log(`✔ GET /api/admin/orders (200 OK, retrieved ${listAuditOrdersJson.orders.length} orders)`);

  // 3.6 Get Order Audit
  const getAuditReq = makeReq("http://localhost:3000/api/admin/orders/ORD-402", {
    token: adminToken,
  });
  const getAuditRes = await getAdminOrderAudit(getAuditReq, { params: Promise.resolve({ id: "ORD-402" }) });
  const getAuditJson = await getAuditRes.json();
  assert.strictEqual(getAuditRes.status, 200);
  assert.strictEqual(getAuditJson.orderVersions.id, "ORD-402");
  console.log("✔ GET /api/admin/orders/{id} (200 OK)");

  // 3.7 Blacklist Customer
  const blacklistReq = makeReq("http://localhost:3000/api/admin/blacklist/customer/CST-001", {
    method: "POST",
    token: adminToken,
    body: { reason: "Repeated unclaimed fraudulent parcels" },
  });
  const blacklistRes = await blacklistCustomer(blacklistReq, { params: Promise.resolve({ id: "CST-001" }) });
  assert.strictEqual(blacklistRes.status, 200);
  console.log("✔ POST /api/admin/blacklist/customer/{id} (200 OK)");

  // 3.8 Config OCR Toggles
  const configReq = makeReq("http://localhost:3000/api/admin/config/staff/ai-ocr-verify/enable", {
    method: "POST",
    token: adminToken,
    body: {},
  });
  const configRes = await setOcrConfig(configReq, {
    params: Promise.resolve({ target: "staff", action: "enable" }),
  });
  assert.strictEqual(configRes.status, 200);
  console.log("✔ POST /api/admin/config/{target}/ai-ocr-verify/{action} (200 OK)");

  // ==========================================
  // 4. Notifications Flow
  // ==========================================
  console.log("\n--- Testing Notification Endpoints ---");

  // 4.1 Upload Token
  const uploadTokenReq = makeReq("http://localhost:3000/api/notification/upload-token", {
    method: "POST",
    token: customerAuthToken,
    body: { fcmToken: "fcm_test_device_token_xyz" },
  });
  const uploadTokenRes = await uploadFcmToken(uploadTokenReq);
  assert.strictEqual(uploadTokenRes.status, 200);
  console.log("✔ POST /api/notification/upload-token (200 OK)");

  // 4.2 Send Notification
  const sendNotifReq = makeReq("http://localhost:3000/api/notification/send-notification", {
    method: "POST",
    token: staffAuthToken,
    body: {
      fcmToken: "fcm_test_device_token_xyz",
      notificationBody: "Your package VXE R1 Nearlink has arrived at the hub!",
    },
  });
  const sendNotifRes = await sendNotification(sendNotifReq);
  assert.strictEqual(sendNotifRes.status, 200);
  console.log("✔ POST /api/notification/send-notification (200 OK)");

  console.log("\n🎉 ALL 23 PARCELHUB API ROUTES VERIFIED SUCCESSFULLY WITH 100% PASS RATE!");
}

runTests().catch((err) => {
  console.error("\n❌ Test Failed:", err);
  process.exit(1);
});

