/**
 * ParcelHub Image Size Utilities (v1)
 * Enforces attachment size limits for customer screenshots and staff parcel proofs.
 */

const DEFAULT_CLIENT_IMAGE_MAX_KB = 110;
const DEFAULT_STAFF_IMAGE_MAX_KB = 200;

export type ImageValidationResult = {
  readonly valid: boolean;
  readonly sizeBytes: number;
  readonly sizeKb: number;
  readonly limitKb: number;
  readonly error?: string;
};

/**
 * Calculates the binary byte length of an image attachment payload.
 * Supports:
 * - Data URIs: "data:image/webp;base64,..."
 * - Raw base64 strings
 * - Remote URLs: "https://..." (calculated as UTF-8 string bytes)
 */
export function getImageByteLength(imageStr: string): number {
  if (!imageStr || typeof imageStr !== "string") {
    return 0;
  }

  const trimmed = imageStr.trim();
  if (trimmed.length === 0) {
    return 0;
  }

  // Handle data URIs (e.g., data:image/webp;base64,...)
  const dataUriMatch = trimmed.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]*)$/);
  if (dataUriMatch && dataUriMatch[1]) {
    const base64Data = dataUriMatch[1].replace(/\s+/g, "");
    return Buffer.byteLength(base64Data, "base64");
  }

  // Remote HTTP/HTTPS URLs (typically lightweight mock / CDN references)
  if (/^https?:\/\//i.test(trimmed)) {
    return Buffer.byteLength(trimmed, "utf-8");
  }

  // Raw base64 string check (alphanumeric with +, /, = and sufficient length)
  const isBase64Candidate =
    trimmed.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed.replace(/\s+/g, ""));

  if (isBase64Candidate) {
    try {
      return Buffer.byteLength(trimmed.replace(/\s+/g, ""), "base64");
    } catch {
      return Buffer.byteLength(trimmed, "utf-8");
    }
  }

  // Fallback to UTF-8 byte length
  return Buffer.byteLength(trimmed, "utf-8");
}

/**
 * Retrieves the configured maximum image size limit in KB for a specific role.
 */
export function getImageMaxLimitKb(role: "CUSTOMER" | "STAFF"): number {
  if (role === "CUSTOMER") {
    const rawEnv = process.env.CLIENT_IMAGE_MAX_KB;
    const parsed = rawEnv ? parseInt(rawEnv, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CLIENT_IMAGE_MAX_KB;
  }

  const rawEnv = process.env.STAFF_IMAGE_MAX_KB;
  const parsed = rawEnv ? parseInt(rawEnv, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STAFF_IMAGE_MAX_KB;
}

/**
 * Validates an image attachment against configured threshold for the given role.
 */
export function validateImageSize(
  imageStr: string,
  role: "CUSTOMER" | "STAFF"
): ImageValidationResult {
  const limitKb = getImageMaxLimitKb(role);
  const maxBytes = limitKb * 1024;
  const sizeBytes = getImageByteLength(imageStr);
  const sizeKb = Math.round((sizeBytes / 1024) * 100) / 100;

  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      sizeBytes,
      sizeKb,
      limitKb,
      error: `Image size (${sizeKb} KB) exceeds the maximum allowed limit of ${limitKb} KB`,
    };
  }

  return {
    valid: true,
    sizeBytes,
    sizeKb,
    limitKb,
  };
}
