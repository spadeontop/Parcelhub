import assert from "node:assert";
import {
  getImageByteLength,
  getImageMaxLimitKb,
  validateImageSize,
} from "../app/lib/v1/image";

console.log("🚀 Running Image Size Utility & Limit Tests...");

// Helper: generate synthetic base64 payload of approximate byte size
function createBase64Payload(targetBytes: number, withDataUri = false): string {
  const buffer = Buffer.alloc(targetBytes, 0x41); // 'A'
  const base64 = buffer.toString("base64");
  return withDataUri ? `data:image/webp;base64,${base64}` : base64;
}

// 1. Test getImageByteLength
console.log("1. Testing getImageByteLength...");
{
  const emptyLen = getImageByteLength("");
  assert.strictEqual(emptyLen, 0, "Empty string should return 0 bytes");

  const raw100Bytes = createBase64Payload(100, false);
  const measuredRaw = getImageByteLength(raw100Bytes);
  assert.strictEqual(measuredRaw, 100, "Raw base64 of 100 bytes should measure 100");

  const uri100Bytes = createBase64Payload(100, true);
  const measuredUri = getImageByteLength(uri100Bytes);
  assert.strictEqual(measuredUri, 100, "Data URI base64 of 100 bytes should measure 100");

  const urlPayload = "https://example.com/images/receipt.webp";
  const measuredUrl = getImageByteLength(urlPayload);
  assert.strictEqual(measuredUrl, Buffer.byteLength(urlPayload, "utf-8"), "URL should measure UTF-8 byte length");
  console.log("   ✅ Byte length calculation accurate across raw base64, data URIs, and URLs.");
}

// 2. Test getImageMaxLimitKb defaults
console.log("2. Testing getImageMaxLimitKb...");
{
  const customerLimit = getImageMaxLimitKb("CUSTOMER");
  assert.strictEqual(customerLimit, 110, "Default customer limit must be 110 KB");

  const staffLimit = getImageMaxLimitKb("STAFF");
  assert.strictEqual(staffLimit, 200, "Default staff limit must be 200 KB");
  console.log("   ✅ Default thresholds verified (Customer=110KB, Staff=200KB).");
}

// 3. Test validateImageSize for CUSTOMER
console.log("3. Testing validateImageSize for CUSTOMER (110 KB limit)...");
{
  // 100 KB payload -> Valid
  const validCustPayload = createBase64Payload(100 * 1024, true);
  const validCustRes = validateImageSize(validCustPayload, "CUSTOMER");
  assert.strictEqual(validCustRes.valid, true, "100KB payload should be valid for customer");

  // 120 KB payload -> Invalid
  const oversizeCustPayload = createBase64Payload(120 * 1024, true);
  const oversizeCustRes = validateImageSize(oversizeCustPayload, "CUSTOMER");
  assert.strictEqual(oversizeCustRes.valid, false, "120KB payload should be rejected for customer");
  assert.match(oversizeCustRes.error || "", /exceeds the maximum allowed limit of 110 KB/);
  console.log("   ✅ Customer 110KB boundary checks passed.");
}

// 4. Test validateImageSize for STAFF
console.log("4. Testing validateImageSize for STAFF (200 KB limit)...");
{
  // 180 KB payload -> Valid
  const validStaffPayload = createBase64Payload(180 * 1024, true);
  const validStaffRes = validateImageSize(validStaffPayload, "STAFF");
  assert.strictEqual(validStaffRes.valid, true, "180KB payload should be valid for staff");

  // 210 KB payload -> Invalid
  const oversizeStaffPayload = createBase64Payload(210 * 1024, true);
  const oversizeStaffRes = validateImageSize(oversizeStaffPayload, "STAFF");
  assert.strictEqual(oversizeStaffRes.valid, false, "210KB payload should be rejected for staff");
  assert.match(oversizeStaffRes.error || "", /exceeds the maximum allowed limit of 200 KB/);
  console.log("   ✅ Staff 200KB boundary checks passed.");
}

console.log("\n🎉 ALL IMAGE SIZE UNIT TESTS PASSED (100% GREEN)!\n");

