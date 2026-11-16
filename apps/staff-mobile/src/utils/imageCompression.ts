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
  const pureBase64 = base64Str
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
    .replace(/\s+/g, '');
  const padding = pureBase64.endsWith('==') ? 2 : pureBase64.endsWith('=') ? 1 : 0;
  return Math.floor((pureBase64.length * 3) / 4) - padding;
}

/**
 * Compresses staff parcel proof photo according to IMAGE_COMPRESSION.md (V1):
 * - Dimensions: max 800px (scales down maintaining aspect ratio if either side > 800px)
 * - Format: WebP (image/webp)
 * - Quality: 80% lossy (0.8) for clear label readability
 * - Payload Ceiling: strictly enforces < 110KB Base64
 */
export async function compressStaffProof(
  sourceUri: string,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<CompressedImageResult> {
  const actions: ImageManipulator.Action[] = [];

  // Dimension bounds checking: scale down longest side to max 800px
  if (sourceWidth && sourceHeight) {
    if (sourceWidth > 800 || sourceHeight > 800) {
      if (sourceWidth >= sourceHeight) {
        actions.push({ resize: { width: 800 } });
      } else {
        actions.push({ resize: { height: 800 } });
      }
    }
  } else {
    // If dimensions are not pre-known, constrain width to 800 (preserving aspect ratio)
    actions.push({ resize: { width: 800 } });
  }

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    actions,
    {
      compress: 0.8, // 80% lossy compression for high visual fidelity proof
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,
    }
  );

  const base64DataUri = `data:image/webp;base64,${result.base64}`;
  const sizeBytes = getBase64ByteLength(base64DataUri);

  // Payload guard: ceiling is 110KB
  if (sizeBytes > 110 * 1024) {
    // If 0.8 quality exceeded 110KB on a very complex scene, auto-retry with slightly higher compression (0.6)
    const fallbackResult = await ImageManipulator.manipulateAsync(
      sourceUri,
      actions,
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.WEBP,
        base64: true,
      }
    );
    const fallbackDataUri = `data:image/webp;base64,${fallbackResult.base64}`;
    const fallbackBytes = getBase64ByteLength(fallbackDataUri);

    if (fallbackBytes > 110 * 1024) {
      throw new Error(
        `Compressed parcel image (${Math.round(fallbackBytes / 1024)} KB) exceeds 110KB payload limit.`
      );
    }

    return {
      uri: fallbackResult.uri,
      base64: fallbackDataUri,
      width: fallbackResult.width,
      height: fallbackResult.height,
      sizeBytes: fallbackBytes,
    };
  }

  return {
    uri: result.uri,
    base64: base64DataUri,
    width: result.width,
    height: result.height,
    sizeBytes,
  };
}
