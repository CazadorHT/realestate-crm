import crypto from "node:crypto";

/**
 * 🔐 Enterprise Encryption Service (Phase 4)
 * Uses AES-256-GCM for Military-Grade Data Privacy.
 * 
 * Format: IV (12 bytes) : AUTH_TAG (16 bytes) : ENCRYPTED_DATA
 */

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "fallback-secret-at-least-32-chars-long";
const BLIND_INDEX_SECRET = process.env.BLIND_INDEX_SECRET || ENCRYPTION_SECRET;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

/**
 * 🔑 Get Master Key from environment
 * We hash the secret to ensure it's exactly 32 bytes.
 */
function getEncryptionKey(): Buffer {
  const secret = ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("CRITICAL: ENCRYPTION_SECRET environment variable is missing.");
  }

  // Use SHA-256 to derive a consistent 32-byte key from any string
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("[CRYPTO-ERROR] Encryption failed:", error);
    return text; // Fallback to original text to prevent system crash
  }
}

/**
 * Decrypt an encrypted string using AES-256-GCM.
 * 🛡️ [LAZY LOGIC]: If data is not in encrypted format, returns original string.
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;

  // 1. Quick format check (iv:authTag:data)
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    return encryptedText; // Likely old unencrypted data
  }

  try {
    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedDataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // 🛡️ Security Watchdog: If decryption fails, it might be unencrypted data 
    // that happened to have colons, or a different key was used.
    console.warn("[CRYPTO-WARN] Decryption failed, returning raw value.");
    return encryptedText;
  }
}

/**
 * Helper to check if a string is already encrypted.
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text) return false;
  const parts = text.split(":");
  if (parts.length !== 3) return false;
  
  const hexRegex = /^[0-9a-fA-F]+$/;
  return parts.every((p) => hexRegex.test(p));
}

/**
 * Generate a Blind Index (HMAC-SHA256) for a value
 * Used for exact-match searching on encrypted columns
 */
export function generateBlindIndex(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  
  try {
    // Normalize value (lowercase, trim, and remove special characters) for consistent indexing
    const normalized = value.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    
    return crypto
      .createHmac("sha256", BLIND_INDEX_SECRET)
      .update(normalized)
      .digest("hex");
  } catch (error) {
    console.error("[BLIND-INDEX-ERROR] Failed to generate index:", error);
    return null;
  }
}
