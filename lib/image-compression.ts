/**
 * Image compression utilities
 * - Compresses images before upload
 * - Converts to WebP for better compression
 * - Resizes to max 1600px
 */

export interface CompressionOptions {
  maxSizeMB?: number; // Max file size in MB
  maxWidthOrHeight?: number; // Max dimension
  useWebWorker?: boolean; // Use web worker for better performance
  fileType?: string; // Output format
  quality?: number; // 0-1
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // percentage
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.35, // 350KB target cap (saves up to 80% bandwidth & storage)
  maxWidthOrHeight: 1600, // Optimal resolution for Retina screens and mobile displays
  useWebWorker: true,
  fileType: "image/webp",
  quality: 0.82, // S-Tier WebP quality with invisible compression artifacts
};

/**
 * Compress image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const originalSize = file.size;

    // Dynamic import to reduce initial bundle size
    const { default: imageCompression } = await import("browser-image-compression");
    const compressedFile = await imageCompression(file, mergedOptions);

    const compressedSize = compressedFile.size;
    const compressionRatio = (1 - compressedSize / originalSize) * 100;

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error("[Compression] Error:", error);
    // Fallback: return original file
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
    };
  }
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (index: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], options);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
