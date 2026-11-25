import { Platform } from 'react-native';
import { scanFromURLAsync } from 'expo-camera';
import type { BarcodeScanningResult, BarcodeType } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import jsQR from 'jsqr';
import UPNG from 'upng-js';

export interface QrImageAsset {
  uri: string;
  width?: number;
  height?: number;
}

export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

const MAX_SCAN_DIMENSION = 640;
const MIN_SCAN_DIMENSION = 320;
const UPSCALE_TARGET_DIMENSION = 400;
const QUIET_ZONE_RATIO = 0.3;
const MIN_QUIET_ZONE_PX = 48;
const WEB_WIDE_SCAN_DIMENSION = 440;
const WEB_WIDE_QUIET_ZONE_RATIO = 0.48;

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < BASE64_ALPHABET.length; i++) {
    table[BASE64_ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64
    .replace(/^data:[^;]+;base64,/, '')
    .replace(/\s+/g, '');
  const len = clean.length;
  let padding = 0;
  if (len >= 2 && clean[len - 1] === '=') padding++;
  if (len >= 2 && clean[len - 2] === '=') padding++;

  const byteLength = Math.floor((len * 3) / 4) - padding;
  const bytes = new Uint8Array(Math.max(0, byteLength));
  let out = 0;

  for (let i = 0; i < len; i += 4) {
    const c0 = clean.charCodeAt(i);
    const c1 = clean.charCodeAt(i + 1);
    const c2 = clean.charCodeAt(i + 2);
    const c3 = clean.charCodeAt(i + 3);

    const a = c0 < 128 ? BASE64_LOOKUP[c0] : -1;
    const b = c1 < 128 ? BASE64_LOOKUP[c1] : -1;
    const c = c2 < 128 ? BASE64_LOOKUP[c2] : -1;
    const d = c3 < 128 ? BASE64_LOOKUP[c3] : -1;

    if (a < 0 || b < 0) break;
    const triple = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);

    if (out < byteLength) bytes[out++] = (triple >> 16) & 0xff;
    if (out < byteLength) bytes[out++] = (triple >> 8) & 0xff;
    if (out < byteLength) bytes[out++] = triple & 0xff;
  }

  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const len = bytes.length;
  const chunkSize = 0x3000; // multiple of 3 for clean chunking

  for (let start = 0; start < len; start += chunkSize) {
    const end = Math.min(start + chunkSize, len);
    let part = '';
    for (let i = start; i < end; i += 3) {
      const b0 = bytes[i];
      const hasB1 = i + 1 < len;
      const hasB2 = i + 2 < len;
      const b1 = hasB1 ? bytes[i + 1] : 0;
      const b2 = hasB2 ? bytes[i + 2] : 0;

      const triple = (b0 << 16) | (b1 << 8) | b2;
      part +=
        BASE64_ALPHABET[(triple >> 18) & 0x3f] +
        BASE64_ALPHABET[(triple >> 12) & 0x3f] +
        (hasB1 ? BASE64_ALPHABET[(triple >> 6) & 0x3f] : '=') +
        (hasB2 ? BASE64_ALPHABET[triple & 0x3f] : '=');
    }
    chunks.push(part);
  }

  return chunks.join('');
}

/**
 * Composites RGBA pixels onto a solid white background and adds a white
 * quiet-zone border on all 4 sides so tightly cropped (1:1) QR images
 * satisfy ISO/IEC 18004 quiet-zone requirements for ML Kit, BarcodeDetector, and jsQR.
 */
export function padRgbaOverWhite(
  source: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  paddingPx: number
): RgbaImage {
  const pad = Math.max(0, Math.round(paddingPx));
  const paddedWidth = width + pad * 2;
  const paddedHeight = height + pad * 2;
  const data = new Uint8ClampedArray(paddedWidth * paddedHeight * 4);
  data.fill(255);

  for (let y = 0; y < height; y++) {
    const srcRowStart = y * width * 4;
    const dstRowStart = ((y + pad) * paddedWidth + pad) * 4;

    for (let x = 0; x < width; x++) {
      const srcIdx = srcRowStart + x * 4;
      const dstIdx = dstRowStart + x * 4;
      const alpha = source[srcIdx + 3];

      if (alpha === 255) {
        data[dstIdx] = source[srcIdx];
        data[dstIdx + 1] = source[srcIdx + 1];
        data[dstIdx + 2] = source[srcIdx + 2];
        data[dstIdx + 3] = 255;
      } else if (alpha > 0) {
        const invAlpha = 255 - alpha;
        data[dstIdx] = (source[srcIdx] * alpha + 255 * invAlpha + 127) >> 8;
        data[dstIdx + 1] = (source[srcIdx + 1] * alpha + 255 * invAlpha + 127) >> 8;
        data[dstIdx + 2] = (source[srcIdx + 2] * alpha + 255 * invAlpha + 127) >> 8;
        data[dstIdx + 3] = 255;
      }
      // alpha === 0 stays pure white (255, 255, 255, 255)
    }
  }

  return { data, width: paddedWidth, height: paddedHeight };
}

/**
 * Fast 2x2 box-filter downscale to smooth out close-up camera noise / screen moire
 * and reduce module size for decoders that struggle with oversized finder patterns.
 */
export function downscaleRgbaHalf(image: RgbaImage): RgbaImage {
  const dstWidth = Math.max(1, Math.floor(image.width / 2));
  const dstHeight = Math.max(1, Math.floor(image.height / 2));
  const dst = new Uint8ClampedArray(dstWidth * dstHeight * 4);
  const src = image.data;
  const srcStride = image.width * 4;

  for (let y = 0; y < dstHeight; y++) {
    const row0 = y * 2 * srcStride;
    const row1 = row0 + srcStride;
    const dstRow = y * dstWidth * 4;

    for (let x = 0; x < dstWidth; x++) {
      const s00 = row0 + x * 8;
      const s01 = s00 + 4;
      const s10 = row1 + x * 8;
      const s11 = s10 + 4;
      const d = dstRow + x * 4;

      dst[d] = (src[s00] + src[s01] + src[s10] + src[s11]) >> 2;
      dst[d + 1] = (src[s00 + 1] + src[s01 + 1] + src[s10 + 1] + src[s11 + 1]) >> 2;
      dst[d + 2] = (src[s00 + 2] + src[s01 + 2] + src[s10 + 2] + src[s11 + 2]) >> 2;
      dst[d + 3] = 255;
    }
  }

  return { data: dst, width: dstWidth, height: dstHeight };
}

export function extractUniqueBarcodeValues(barcodes: BarcodeScanningResult[]): string[] {
  return [...new Set(barcodes.map(({ data }) => data.trim()).filter(Boolean))];
}

function toArrayBuffer(view: Uint8Array | Uint8ClampedArray): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function encodeRgbaToPngDataUri(image: RgbaImage): string {
  const pngBuffer = UPNG.encode([toArrayBuffer(image.data)], image.width, image.height, 0);
  return `data:image/png;base64,${uint8ArrayToBase64(new Uint8Array(pngBuffer))}`;
}

function decodeQrWithJsQr(image: RgbaImage): string[] {
  const result = jsQR(image.data, image.width, image.height, {
    inversionAttempts: 'attemptBoth',
  });
  const value = result?.data?.trim();
  return value ? [value] : [];
}

/**
 * Pure PNG-bytes fallback pipeline (exposed for unit verification as well as native runtime):
 * decodes PNG -> composites over white + adds quiet zone -> optional external scanner -> jsQR -> 2x downscale.
 */
export async function scanPaddedPngBytes(
  pngBytes: Uint8Array,
  scanDataUri?: (dataUri: string) => Promise<string[]>,
  signal?: AbortSignal
): Promise<string[]> {
  const decoded = UPNG.decode(toArrayBuffer(pngBytes));
  const rgbaFrames = UPNG.toRGBA8(decoded);
  const frameBuffer = rgbaFrames[0];
  if (!frameBuffer || decoded.width <= 0 || decoded.height <= 0) {
    return [];
  }

  const paddingPx = Math.max(
    MIN_QUIET_ZONE_PX,
    Math.round(Math.max(decoded.width, decoded.height) * QUIET_ZONE_RATIO)
  );
  const padded = padRgbaOverWhite(
    new Uint8Array(frameBuffer),
    decoded.width,
    decoded.height,
    paddingPx
  );

  if (signal?.aborted) return [];

  if (scanDataUri) {
    try {
      const paddedDataUri = encodeRgbaToPngDataUri(padded);
      const scanned = await scanDataUri(paddedDataUri);
      if (signal?.aborted) return [];
      if (scanned.length > 0) return scanned;
    } catch {
      // Fall through to pure-JS jsQR decoding on the same padded RGBA buffer.
    }
  }

  const jsQrCodes = decodeQrWithJsQr(padded);
  if (jsQrCodes.length > 0) return jsQrCodes;

  // For noisy or oversized close-up photos, try a 2x downscaled copy (reduces module size & moire).
  if (Math.max(padded.width, padded.height) >= 480) {
    const half = downscaleRgbaHalf(padded);
    const halfJsQrCodes = decodeQrWithJsQr(half);
    if (halfJsQrCodes.length > 0) return halfJsQrCodes;

    if (scanDataUri && !signal?.aborted) {
      try {
        const halfDataUri = encodeRgbaToPngDataUri(half);
        const scannedHalf = await scanDataUri(halfDataUri);
        if (signal?.aborted) return [];
        if (scannedHalf.length > 0) return scannedHalf;
      } catch {
        // Ignore and return empty.
      }
    }
  }

  return [];
}

function getNativeResizeActions(asset: QrImageAsset): ImageManipulator.Action[] {
  const { width, height } = asset;
  if (!width || !height) return [];

  const maxSide = Math.max(width, height);
  if (maxSide > MAX_SCAN_DIMENSION) {
    return width >= height
      ? [{ resize: { width: MAX_SCAN_DIMENSION } }]
      : [{ resize: { height: MAX_SCAN_DIMENSION } }];
  }

  if (maxSide < MIN_SCAN_DIMENSION) {
    return width >= height
      ? [{ resize: { width: UPSCALE_TARGET_DIMENSION } }]
      : [{ resize: { height: UPSCALE_TARGET_DIMENSION } }];
  }

  return [];
}

async function scanPaddedNative(
  asset: QrImageAsset,
  barcodeTypes: BarcodeType[],
  signal?: AbortSignal
): Promise<string[]> {
  const actions = getNativeResizeActions(asset);
  let normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    format: ImageManipulator.SaveFormat.PNG,
    base64: true,
  });
  if (signal?.aborted) return [];

  // If picker omitted dimensions and image turned out huge, downscale before decoding in JS.
  if (
    actions.length === 0 &&
    Math.max(normalized.width, normalized.height) > MAX_SCAN_DIMENSION
  ) {
    const shrinkAction: ImageManipulator.Action =
      normalized.width >= normalized.height
        ? { resize: { width: MAX_SCAN_DIMENSION } }
        : { resize: { height: MAX_SCAN_DIMENSION } };
    normalized = await ImageManipulator.manipulateAsync(normalized.uri, [shrinkAction], {
      format: ImageManipulator.SaveFormat.PNG,
      base64: true,
    });
    if (signal?.aborted) return [];
  }

  if (!normalized.base64) return [];
  const pngBytes = base64ToUint8Array(normalized.base64);

  return scanPaddedPngBytes(
    pngBytes,
    async (dataUri) => extractUniqueBarcodeValues(await scanFromURLAsync(dataUri, barcodeTypes)),
    signal
  );
}

async function scanPaddedWeb(
  asset: QrImageAsset,
  barcodeTypes: BarcodeType[],
  signal?: AbortSignal
): Promise<string[]> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') {
    return [];
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  try {
    if (signal?.aborted) return [];

    const renderPaddedCanvas = (
      targetMaxSide: number,
      quietZoneRatio: number
    ): HTMLCanvasElement | null => {
      const srcMax = Math.max(bitmap.width, bitmap.height);
      if (srcMax <= 0) return null;

      const scale =
        srcMax > targetMaxSide
          ? targetMaxSide / srcMax
          : srcMax < MIN_SCAN_DIMENSION
            ? UPSCALE_TARGET_DIMENSION / srcMax
            : 1;
      const drawW = Math.max(1, Math.round(bitmap.width * scale));
      const drawH = Math.max(1, Math.round(bitmap.height * scale));
      const pad = Math.max(MIN_QUIET_ZONE_PX, Math.round(Math.max(drawW, drawH) * quietZoneRatio));

      const canvas = document.createElement('canvas');
      canvas.width = drawW + pad * 2;
      canvas.height = drawH + pad * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = scale < 1;
      ctx.drawImage(bitmap, pad, pad, drawW, drawH);
      return canvas;
    };

    const passes: Array<[number, number]> = [
      [MAX_SCAN_DIMENSION, QUIET_ZONE_RATIO],
      [WEB_WIDE_SCAN_DIMENSION, WEB_WIDE_QUIET_ZONE_RATIO],
    ];

    let firstCanvas: HTMLCanvasElement | null = null;

    for (const [targetMaxSide, ratio] of passes) {
      if (signal?.aborted) return [];
      const canvas = renderPaddedCanvas(targetMaxSide, ratio);
      if (!canvas) continue;
      if (!firstCanvas) firstCanvas = canvas;

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const scanned = extractUniqueBarcodeValues(await scanFromURLAsync(dataUrl, barcodeTypes));
        if (signal?.aborted) return [];
        if (scanned.length > 0) return scanned;
      } catch {
        // Continue to next pass / jsQR fallback.
      }
    }

    if (firstCanvas && !signal?.aborted) {
      const ctx = firstCanvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, firstCanvas.width, firstCanvas.height);
        const jsQrCodes = decodeQrWithJsQr({
          data: imageData.data,
          width: firstCanvas.width,
          height: firstCanvas.height,
        });
        if (jsQrCodes.length > 0) return jsQrCodes;
      }
    }

    return [];
  } finally {
    bitmap.close();
  }
}

/**
 * Scans QR codes from a user-selected image asset.
 * 1. Fast path: scans the original image directly via `expo-camera`'s `scanFromURLAsync`.
 * 2. Fallback: if no code is detected (common when a QR code fills the image 1:1 with
 *    no quiet zone, is tightly cropped, transparent, inverted, or oversized), normalizes
 *    scale, composites onto white with a generous quiet-zone border, and retries with
 *    both native/web detection and pure-JS `jsQR`.
 */
export async function scanQrImageFromAsset(
  asset: QrImageAsset,
  barcodeTypes: BarcodeType[],
  signal?: AbortSignal
): Promise<string[]> {
  let initialError: unknown = null;

  try {
    const initialResults = await scanFromURLAsync(asset.uri, barcodeTypes);
    if (signal?.aborted) return [];
    const initialCodes = extractUniqueBarcodeValues(initialResults);
    if (initialCodes.length > 0) {
      return initialCodes;
    }
  } catch (error) {
    initialError = error;
  }

  if (signal?.aborted) return [];

  try {
    const fallbackCodes =
      Platform.OS === 'web'
        ? await scanPaddedWeb(asset, barcodeTypes, signal)
        : await scanPaddedNative(asset, barcodeTypes, signal);
    if (fallbackCodes.length > 0) {
      return fallbackCodes;
    }
  } catch (fallbackError) {
    if (initialError) {
      throw initialError;
    }
    throw fallbackError;
  }

  if (initialError) {
    throw initialError;
  }

  return [];
}
