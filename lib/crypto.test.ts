import { describe, it, expect } from "vitest";
import { generateBlindIndex, encrypt, decrypt } from "./crypto";

describe("Crypto & Blind Indexing (Phase 4)", () => {
  const originalValue = "081-234-5678";

  it("should generate a consistent blind index (HMAC-SHA256)", () => {
    const hash1 = generateBlindIndex(originalValue);
    const hash2 = generateBlindIndex(originalValue);
    const hash3 = generateBlindIndex("0812345678"); // Normalized should be same

    expect(hash1).toBeDefined();
    expect(hash1?.length).toBe(64); // SHA256 hex length
    expect(hash1).toBe(hash2); // Consistency check
    expect(hash1).toBe(hash3); // Should be same due to normalization [0812345678]
  });

  it("should generate different hashes for different values", () => {
    const hash1 = generateBlindIndex("value-1");
    const hash2 = generateBlindIndex("value-2");
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty or null values gracefully", () => {
    expect(generateBlindIndex("")).toBe(null);
    expect(generateBlindIndex(null as any)).toBe(null);
  });

  it("should encrypt and decrypt values correctly", () => {
    const encrypted = encrypt(originalValue);
    expect(encrypted).not.toBe(originalValue);
    expect(encrypted?.split(":").length).toBe(3);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalValue);
  });

  describe("Brutal Crypto Edge Cases", () => {
    it("should handle extremely long strings (100k+ characters)", () => {
      const longText = "A".repeat(100000);
      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(longText);
    });

    it("should handle special and multi-byte characters", () => {
      const emojiText = "🚀 Thai: ภาษาไทย Chinese: 🚀 汉字 Unicode: \u2728";
      const encrypted = encrypt(emojiText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(emojiText);
    });

    it("should gracefully handle malformed encrypted strings", () => {
      const badInputs = [
        "not-encrypted",
        "too:many:parts:here",
        "not:enough",
        "invalid:hex:characters",
        "123:456:789",
        "::", // Empty parts
      ];

      badInputs.forEach(input => {
        // Should return raw input due to lazy logic
        expect(decrypt(input)).toBe(input);
      });
    });

    it("should return null for null/undefined inputs", () => {
      expect(encrypt(null)).toBe(null);
      expect(decrypt(null)).toBe(null);
      expect(encrypt(undefined)).toBe(null);
      expect(decrypt(undefined)).toBe(null);
    });

    it("should generate consistent blind indices for same values regardless of case/spaces", () => {
      const v1 = "  HUNTER@Test.com  ";
      const v2 = "hunter@test.com";
      expect(generateBlindIndex(v1)).toBe(generateBlindIndex(v2));
    });
  });
});
