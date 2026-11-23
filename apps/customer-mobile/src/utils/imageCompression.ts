import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedImageResult {
  readonly uri: string;
  readonly base64: string;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
}

const MAX_CUSTOMER_BYTES = 110 * 1024;
const TARGET_WIDTH_PX = 780;

/**
 * Calculates byte size of a base64 string
 */
export function getBase64ByteLength(base64Str: string): number {
  const pureBase64 = base64Str.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').replace(/\s+/g, '');
  const padding = pureBase64.endsWith('==') ? 2 : pureBase64.endsWith('=') ? 1 : 0;
  return Math.floor((pureBase64.length * 3) / 4) - padding;
}

/**
 * Compresses customer receipt screenshot:
 * - Dimensions: caps width at 780px (preserves aspect ratio so portrait phone screenshots stay legible for OCR)
 * - Format: WebP
 * - Quality: 50% lossy (0.5), with a single fallback pass (600px / 0.35) for extra-tall scrolling screenshots
 * - Size check: ensures final base64 is under 110KB ceiling (V1 Feature #4 & IMAGE_COMPRESSION.md)
 */
export async function compressCustomerScreenshot(
  sourceUri: string,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<CompressedImageResult> {
  const actions: ImageManipulator.Action[] = [];

  // Cap width at 780px (avoid upscaling images already narrower than 780px)
  if (!sourceWidth || sourceWidth > TARGET_WIDTH_PX) {
    actions.push({ resize: { width: TARGET_WIDTH_PX } });
  }

  let result = await ImageManipulator.manipulateAsync(
    sourceUri,
    actions,
    {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,
    }
  );

  let base64DataUri = `data:image/webp;base64,${result.base64}`;
  let sizeBytes = getBase64ByteLength(base64DataUri);

  // Safety fallback for extra-tall / scrolling screenshots that exceed 110KB at 780px width
  if (sizeBytes > MAX_CUSTOMER_BYTES) {
    const fallbackActions: ImageManipulator.Action[] =
      !sourceWidth || sourceWidth > 600 ? [{ resize: { width: 600 } }] : [];

    result = await ImageManipulator.manipulateAsync(
      sourceUri,
      fallbackActions,
      {
        compress: 0.35,
        format: ImageManipulator.SaveFormat.WEBP,
        base64: true,
      }
    );

    base64DataUri = `data:image/webp;base64,${result.base64}`;
    sizeBytes = getBase64ByteLength(base64DataUri);
  }

  if (sizeBytes > MAX_CUSTOMER_BYTES) {
    throw new Error(`Compressed image size (${Math.round(sizeBytes / 1024)} KB) exceeds 110KB limit`);
  }

  return {
    uri: result.uri,
    base64: base64DataUri,
    width: result.width,
    height: result.height,
    sizeBytes,
  };
}
