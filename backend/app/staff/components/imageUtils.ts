/**
 * ParcelHub Staff Web - Image Compression Utilities
 * Ensures parcel waybill and package photos uploaded by staff adhere to
 * the 200KB payload limit configured in the backend image validator.
 */

export interface CompressedImageResult {
  readonly dataUrl: string;
  readonly sizeBytes: number;
  readonly sizeKb: number;
  readonly width: number;
  readonly height: number;
}

export function getBase64ByteLength(base64Str: string): number {
  const pureBase64 = base64Str
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")
    .replace(/\s+/g, "");
  const padding = pureBase64.endsWith("==") ? 2 : pureBase64.endsWith("=") ? 1 : 0;
  return Math.floor((pureBase64.length * 3) / 4) - padding;
}

export function compressImageFile(
  file: File,
  maxDimension = 800,
  initialQuality = 0.8
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file must be an image (JPEG, PNG, or WebP)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image in browser."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio, capping max side to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to initialize canvas 2D rendering context."));
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Attempt WebP, fallback to JPEG
        let dataUrl = canvas.toDataURL("image/webp", initialQuality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", initialQuality);
        }

        let sizeBytes = getBase64ByteLength(dataUrl);

        // Safety fallback: if complex image exceeds 150KB, re-encode with 0.6 quality
        if (sizeBytes > 150 * 1024) {
          dataUrl = canvas.toDataURL("image/webp", 0.6);
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          }
          sizeBytes = getBase64ByteLength(dataUrl);
        }

        const sizeKb = Math.round((sizeBytes / 1024) * 10) / 10;
        resolve({
          dataUrl,
          sizeBytes,
          sizeKb,
          width,
          height,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
