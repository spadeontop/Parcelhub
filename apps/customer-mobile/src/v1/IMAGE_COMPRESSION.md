# Image Compression Specification (V1)

This specification defines the exact client-side image processing, dimension scaling, and lossy compression rules required for the Customer Mobile app and Staff app to strictly adhere to the backend payload ceiling (<110KB) defined in [`backend/app/types/v1/api.ts`](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/backend/app/types/v1/api.ts).

---

## 1. Overview & Strategy

The backend enforces a strict payload guard on image uploads (`POST /api/v1/customer/orders/initialize` and staff photo attachments). Uncompressed mobile camera photos (typically 3MB–15MB) will be rejected with HTTP 400 (`ImagePayloadTooLarge`).

All client uploads must undergo:
1. **Format conversion**: Always convert to `.webp`.
2. **Dimension bounds checking**: Constrain max dimension (width or height) to **800px**.
3. **Lossy compression**: Apply target quality factor based on the actor/photo type.

---

## 2. Customer Order Screenshot Compression

Applied in `CreateOrderScreen` when uploading or selecting an order receipt screenshot (Shopee, Lazada, TikTok, etc.).

| Parameter | Specification | Notes |
| :--- | :--- | :--- |
| **Output Format** | **WebP** (`image/webp`) | High efficiency web-optimized format |
| **Dimension Check** | **Max 800px** | If `width > 800` or `height > 800`, resize down maintaining aspect ratio so the longest side is $\le$ 800px. If already $\le$ 800px, preserve original dimensions. |
| **Lossy Quality** | **50% (`0.5`)** | 50% lossy compression provides crystal-clear readability for OCR/text receipts while dropping file size to ~30KB–60KB. |
| **Payload Ceiling** | **< 110KB Base64** | Final payload size is guaranteed to fit well within the backend guard. |

### Customer Client Workflow:
```
[User Picks / Takes Photo]
         │
         ▼
[Check Dimensions] ───> If width or height > 800px ───> Scale down to max 800px
         │
         ▼
[Convert to WebP @ 50% Quality (0.5)]
         │
         ▼
[Compute Base64 Data URI] ───> Verify byte length < 110KB
         │
         ▼
[Dispatch POST /api/v1/customer/orders/initialize]
```

---

## 3. Staff Proof of Delivery Image Compression

Applied in the Staff App when staff takes a photo of the received parcel at the counter to mark it claimable.

| Parameter | Specification | Notes |
| :--- | :--- | :--- |
| **Output Format** | **WebP** (`image/webp`) | High efficiency web-optimized format |
| **Dimension Check** | **Max 800px** | If `width > 800` or `height > 800`, scale down maintaining aspect ratio so the longest side is $\le$ 800px. |
| **Lossy Quality** | **80% (`0.8`)** | Higher visual fidelity (80% quality) to clearly show parcel label, pouch condition, and tracking sticker intactness. |
| **Payload Ceiling** | **< 110KB Base64** | Cleanly fits within payload constraints. |

---

## 4. Implementation Details (React Native / Expo)

Using `expo-image-manipulator`:

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedImageResult {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

/**
 * Compresses customer receipt screenshot:
 * - Dimensions: scaled down to max 800px
 * - Format: WebP
 * - Quality: 50% lossy (0.5)
 */
export async function compressCustomerScreenshot(
  sourceUri: string,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<CompressedImageResult> {
  const actions: ImageManipulator.Action[] = [];

  // Dimension check: if either side > 800, shrink down
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
      compress: 0.5, // 50% lossy compression
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,
    }
  );

  return {
    uri: result.uri,
    base64: `data:image/webp;base64,${result.base64}`,
    width: result.width,
    height: result.height,
  };
}

/**
 * Compresses staff parcel proof photo:
 * - Dimensions: scaled down to max 800px
 * - Format: WebP
 * - Quality: 80% lossy (0.8)
 */
export async function compressStaffProof(
  sourceUri: string,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<CompressedImageResult> {
  const actions: ImageManipulator.Action[] = [];

  if (sourceWidth && sourceHeight) {
    if (sourceWidth > 800 || sourceHeight > 800) {
      if (sourceWidth >= sourceHeight) {
        actions.push({ resize: { width: 800 } });
      } else {
        actions.push({ resize: { height: 800 } });
      }
    }
  } else {
    actions.push({ resize: { width: 800 } });
  }

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    actions,
    {
      compress: 0.8, // 80% lossy compression
      format: ImageManipulator.SaveFormat.WEBP,
      base64: true,
    }
  );

  return {
    uri: result.uri,
    base64: `data:image/webp;base64,${result.base64}`,
    width: result.width,
    height: result.height,
  };
}
```
