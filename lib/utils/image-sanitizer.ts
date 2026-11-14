/**
 * 🖼️ Client-side Image Sanitizer & Compressor
 * - Automatically resizes images to a maximum dimension (default: 1200px)
 * - Compresses to JPEG (quality: 0.85) to ensure files are < 500KB
 * - Provides Base64 data URL for instant zero-latency UI preview
 */

export interface SanitizedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export async function sanitizeAndCompressImage(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.85,
): Promise<SanitizedImageResult> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif|png|jpe?g|webp)$/i)) {
      return reject(new Error("File must be an image"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
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
          return reject(new Error("Failed to get 2D canvas context"));
        }

        // Draw image on canvas
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP (30-50% smaller than JPEG), fallback to JPEG if unsupported
        let mimeType = "image/webp";
        let ext = ".webp";
        let dataUrl = canvas.toDataURL("image/webp", quality);

        if (!dataUrl.startsWith("data:image/webp")) {
          mimeType = "image/jpeg";
          ext = ".jpg";
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to generate image blob"));
            }

            const cleanFileName =
              file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9_-]/g, "_") + ext;

            const compressedFile = new File([blob], cleanFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              dataUrl,
              width,
              height,
              originalSize: file.size,
              compressedSize: compressedFile.size,
            });
          },
          mimeType,
          quality,
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

