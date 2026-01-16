/**
 * PDF Compression Utility
 * Uses pdf-lib to compress PDF files
 */

import { PDFDocument } from "pdf-lib";

export interface CompressResult {
  compressedBuffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress a PDF file
 * @param fileBuffer - Original PDF file buffer
 * @param options - Compression options
 * @returns Compressed PDF buffer and stats
 */
export async function compressPDF(
  fileBuffer: Buffer | ArrayBuffer,
  options?: {
    minCompressionRatio?: number; // Only compress if ratio > this (e.g., 0.1 = 10%)
  }
): Promise<CompressResult> {
  try {
    const originalSize = fileBuffer.byteLength;

    // Load PDF
    const pdfDoc = await PDFDocument.load(fileBuffer);

    // Compress by re-saving with optimization
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true, // Compress objects
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const compressedSize = compressedBytes.byteLength;
    const savedBytes = originalSize - compressedSize;
    const compressionRatio = savedBytes / originalSize;

    // Check if compression is worth it
    const minRatio = options?.minCompressionRatio ?? 0.05; // Default 5%
    if (compressionRatio < minRatio) {
      // Compression didn't help much, return original
      const buffer =
        fileBuffer instanceof ArrayBuffer
          ? Buffer.from(new Uint8Array(fileBuffer))
          : fileBuffer instanceof Buffer
          ? fileBuffer
          : Buffer.from(fileBuffer);

      return {
        compressedBuffer: buffer,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
      };
    }

    return {
      compressedBuffer: Buffer.from(compressedBytes),
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error("PDF compression failed:", error);
    // Return original on error
    const buffer =
      fileBuffer instanceof ArrayBuffer
        ? Buffer.from(new Uint8Array(fileBuffer))
        : fileBuffer instanceof Buffer
        ? fileBuffer
        : Buffer.from(fileBuffer);

    return {
      compressedBuffer: buffer,
      originalSize: fileBuffer.byteLength,
      compressedSize: fileBuffer.byteLength,
      compressionRatio: 0,
    };
  }
}

/**
 * Check if a file is a PDF based on MIME type
 */
export function isPDF(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType === "application/x-pdf";
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
