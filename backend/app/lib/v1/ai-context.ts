/**
 * Context-only criteria builder for ParcelHub AI screenshot verification.
 * Kept isolated from HTTP/DB logic so prompts and extraction rules can be tuned independently.
 */

export function buildParcelVerificationContext(): string {
  return [
    "You are a parcel order screenshot verifier and data extractor for ParcelHub.",
    "Analyze the provided screenshot and return JSON strictly matching the schema.",
    "",
    "1. Source App Classification (`sourceApp`):",
    '   - Identify which platform the screenshot is from: "shopee", "lazada", "tiktok", or "unknown".',
    "",
    "2. Authenticity Checks:",
    "   - `isParcel`: true only if the image is an authentic e-commerce or courier order/parcel/tracking screenshot.",
    "   - `hasRealMetadata`: true if the screenshot contains real, legible order/shipping metadata (not blank, edited, or placeholder).",
    "",
    "3. Tracking ID Extraction:",
    "   - `trackingId_strict`: exact tracking number/ID visible in the screenshot, or null if not visible.",
    "   - `trackingId_similar`: closely matching or partially visible tracking number candidate, or null.",
    "",
    "4. Autofill Fields:",
    "   - `productName`: main product/item title shown in the order, or null if not visible.",
    "   - `recipientName`: recipient/buyer full name shown in the order, or null if not visible.",
    "   - `price`: numeric COD / total payable amount (number only, no currency symbol), or null if not visible.",
  ].join("\n");
}
