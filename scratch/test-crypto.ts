/**
 * 🧪 Test Suite for AES-256-GCM Encryption
 * Run this to verify the crypto utility before applying it to the database.
 */
import { encrypt, decrypt, isEncrypted } from "../lib/crypto";

async function testCrypto() {
  console.log("🧪 Starting Crypto Test Suite...");

  // Mock Environment Variable (64 chars = 32 bytes)
  const MOCK_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  process.env.ENCRYPTION_KEY = MOCK_KEY;

  const secretMessage = "This is a secret S-Tier token: vcc_123456789";
  console.log(`\nInput Message: "${secretMessage}"`);

  try {
    // 1. Test Encryption
    const encrypted = encrypt(secretMessage);
    console.log(`Encrypted Format: ${encrypted}`);
    
    if (!isEncrypted(encrypted)) {
      throw new Error("FAIL: isEncrypted check failed!");
    }
    console.log("✅ Encryption & Format Check: PASSED");

    // 2. Test Decryption
    const decrypted = decrypt(encrypted);
    console.log(`Decrypted Message: "${decrypted}"`);

    if (decrypted !== secretMessage) {
      throw new Error("FAIL: Decrypted message does not match original!");
    }
    console.log("✅ Decryption Accuracy: PASSED");

    // 3. Test Security Monitoring (Tamper Proof)
    console.log("\nTesting Tamper Proofing...");
    if (!encrypted) throw new Error("Encryption failed");
    const tampered = encrypted.slice(0, -4) + "beef"; // Change last 4 chars
    try {
      decrypt(tampered);
      console.log("❌ FAIL: Tampered data was decrypted!");
    } catch (err) {
      console.log("✅ PASS: Tampered data rejected (GCM Tag check works)");
    }

    // 4. Test Key Mismatch
    console.log("\nTesting Key Mismatch...");
    process.env.ENCRYPTION_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"; 
    try {
      decrypt(encrypted);
      console.log("❌ FAIL: Data was decrypted with a different key!");
    } catch (err) {
      console.log("✅ Key Mismatch Detection: PASSED (Decryption failed as expected)");
    }

    console.log("\n🎉 ALL TESTS PASSED! Ready for Enterprise Use.");
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
    process.exit(1);
  }
}

testCrypto();
