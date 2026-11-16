import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedImageResult {
  readonly uri: string;
  readonly base64: string;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
}

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
 * - Dimensions: scaled down to max 800px (aspect ratio preserved)
 * - Format: WebP
 * - Quality: 50% lossy (0.5)
 * - Size check: ensures final base64 is under 110KB ceiling (V1 Feature #4 & IMAGE_COMPRESSION.md)
 */
export async function compressCustomerScreenshot(
  sourceUri: string,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<CompressedImageResult> {
  const actions: ImageManipulator.Action[] = [];

  // Dimension check: if either side > 800, scale down longest dimension to 800px
  if (sourceWidth && sourceHeight) {
    if (sourceWidth > 800 || sourceHeight > 800) {
      if (sourceWidth >= sourceHeight) {
        actions.push({ resize: { width: 800 } });
      } else {
        actions.push({ resize: { height: 800 } });
      }
    }
  } else {
    // If original dimensions are not pre-known, resize width to 800 (aspect ratio preserved)
    actions.push({ resize: { width: 800 } });
  }

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    actions,
    {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,
    }
  );

  const base64DataUri = `data:image/webp;base64,${result.base64}`;
  const sizeBytes = getBase64ByteLength(base64DataUri);

  if (sizeBytes > 110 * 1024) {
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
