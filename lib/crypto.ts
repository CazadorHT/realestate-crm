import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Validate the encryption key from environment variables.
 * It must be a 64-character hex string representing 32 bytes.
 */
function getEncryptionKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;

  if (!hexKey) {
    throw new Error("CRITICAL: ENCRYPTION_KEY environment variable is missing.");
  }

  const keyBuffer = Buffer.from(hexKey, "hex");

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `CRITICAL: ENCRYPTION_KEY must be a ${KEY_LENGTH}-byte hex string (64 hex characters). Found ${keyBuffer.length} bytes.`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Output format: iv:authTag:encryptedData (all hex)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Return as a joined string for easy DB storage
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("[CRYPTO-ERROR] Encryption failed:", error);
    throw new Error("Encryption process failed internally.");
  }
}

/**
 * Decrypt an encrypted string using AES-256-GCM.
 * Expected input format: iv:authTag:encryptedData (all hex)
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format.");
    }

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
    // 🛡️ Security Watchdog: Log Masking
    // We do NOT log the encryptedText or the error details that might leak data
    console.error("[SECURITY-ALERT] Decryption failed. Potentially tampered data or invalid key.");
    throw new Error("Decryption failed.");
  }
}

/**
 * Helper to check if a string is already encrypted (S-Tier format check)
 */
export function isEncrypted(text: string): boolean {
  // Check if it matches our iv:authTag:data hex pattern
  const parts = text.split(":");
  if (parts.length !== 3) return false;
  
  const hexRegex = /^[0-9a-fA-F]+$/;
  return parts.every((p) => hexRegex.test(p));
}
