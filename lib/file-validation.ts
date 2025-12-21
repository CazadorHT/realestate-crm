/**
 * File validation utilities
 * - Validates MIME types
 * - Checks magic bytes (file signature)
 */

const ALLOWED_MIME_TYPES = [
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

function normalizeMime(mime: string) {
  return mime === "image/jpg" ? "image/jpeg" : mime;
}
/**
 * Validate file type by MIME type
 */
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
}

/**
 * Validate file extension
 */
export function isValidFileExtension(filename: string): boolean {
  const trimmed = (filename ?? "").trim();
  const m = trimmed.match(/\.([a-z0-9]+)\s*$/i);
  if (!m) return true;

  const ext = `.${m[1].toLowerCase()}` as any;
  return ALLOWED_EXTENSIONS.includes(ext);
}
/**
 * Check magic bytes (file signature) to verify actual file type
 * Prevents malicious files with fake extensions
 */
export async function validateFileSignature(file: File): Promise<{
  isValid: boolean;
  detectedType: string | null;
}> {
  try {
    // Read first 12 bytes (enough for most image formats)
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { isValid: true, detectedType: 'image/jpeg' };
    }

    // Check PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return { isValid: true, detectedType: 'image/png' };
    }

    // Check WebP: RIFF .... WEBP
    if (
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    ) {
      return { isValid: true, detectedType: 'image/webp' };
    }

    // Check SVG (block it explicitly)
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(bytes);
    if (text.includes('<svg') || text.includes('<?xml')) {
      return { isValid: false, detectedType: 'image/svg+xml' };
    }

    return { isValid: false, detectedType: null };
  } catch (error) {
    console.error('File signature validation error:', error);
    return { isValid: false, detectedType: null };
  }
}

/**
 * Comprehensive file validation
 */
export async function validateImageFile(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!file || file.size === 0) {
    return { valid: false, error: "ไฟล์ว่างหรือไม่ถูกต้อง" };
  }

  // 1) Magic bytes check ก่อน (กัน SVG / กันไฟล์ปลอม)
  const signatureCheck = await validateFileSignature(file);

  if (signatureCheck.detectedType === "image/svg+xml") {
    return {
      valid: false,
      error: "ไม่อนุญาตให้อัปโหลดไฟล์ SVG (เหตุผลด้านความปลอดภัย)",
    };
  }

  if (!signatureCheck.isValid) {
    return { valid: false, error: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง" };
  }

  // 2) MIME type: อนุญาตให้ว่างได้ (บาง browser ส่งค่าว่าง) แล้วพึ่ง signature เป็นหลัก
  if (file.type) {
    const declared = normalizeMime(file.type);
    if (!isValidMimeType(declared)) {
      return {
        valid: false,
        error: `ไฟล์ประเภท ${file.type} ไม่ได้รับอนุญาต (อนุญาตเฉพาะ JPG, PNG, WebP)`,
      };
    }

    // 3) ถ้ามีทั้ง declared + detected แล้วไม่ตรงกัน ให้ reject
    const detected = signatureCheck.detectedType ? normalizeMime(signatureCheck.detectedType) : null;
    if (detected && detected !== declared) {
      return { valid: false, error: "ประเภทไฟล์ไม่ตรงกับเนื้อหาจริง" };
    }
  }

  // 4) Extension: ตรวจแบบยืดหยุ่น (ชื่อไฟล์แปลก ๆ จะไม่โดน block เกินเหตุ)
  if (!isValidFileExtension(file.name)) {
    return { valid: false, error: "นามสกุลไฟล์ไม่ถูกต้อง" };
  }

  return { valid: true };
}

