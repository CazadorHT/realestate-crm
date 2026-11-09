import { describe, it, expect } from "vitest";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";

describe("parseBilingualProjectName Unit Tests", () => {
  it("should extract English in parentheses and strip it from Thai name", () => {
    const input = "เดอะ โมนูเมนต์ ทองหล่อ (The Monument Thong Lo)";
    const result = parseBilingualProjectName(input);
    expect(result.cleanTh).toBe("เดอะ โมนูเมนต์ ทองหล่อ");
    expect(result.cleanEn).toBe("The Monument Thong Lo");
  });

  it("should extract English after slash and strip it from Thai name", () => {
    const input = "ไอดีโอ คิว / Ideo Q";
    const result = parseBilingualProjectName(input);
    expect(result.cleanTh).toBe("ไอดีโอ คิว");
    expect(result.cleanEn).toBe("Ideo Q");
  });

  it("should extract English after dash when preceded by Thai and strip it", () => {
    const input = "แอชตัน สีลม - Ashton Silom";
    const result = parseBilingualProjectName(input);
    expect(result.cleanTh).toBe("แอชตัน สีลม");
    expect(result.cleanEn).toBe("Ashton Silom");
  });

  it("should handle pure English project names cleanly", () => {
    const input = "The Monument Thong Lo";
    const result = parseBilingualProjectName(input);
    expect(result.cleanTh).toBe("The Monument Thong Lo");
    expect(result.cleanEn).toBe("The Monument Thong Lo");
  });

  it("should handle pure Thai project names without English", () => {
    const input = "บ้านกลางเมือง";
    const result = parseBilingualProjectName(input);
    expect(result.cleanTh).toBe("บ้านกลางเมือง");
    expect(result.cleanEn).toBeNull();
  });

  it("should prioritize explicitly provided rawNameEn if present", () => {
    const rawTh = "เดอะ โมนูเมนต์ ทองหล่อ (The Monument Thong Lo)";
    const explicitEn = "The Monument (Luxury Collection)";
    const result = parseBilingualProjectName(rawTh, explicitEn);
    expect(result.cleanTh).toBe("เดอะ โมนูเมนต์ ทองหล่อ");
    expect(result.cleanEn).toBe("The Monument (Luxury Collection)");
  });

  it("should handle null or empty inputs gracefully", () => {
    expect(parseBilingualProjectName(null)).toEqual({ cleanTh: "", cleanEn: null });
    expect(parseBilingualProjectName(undefined)).toEqual({ cleanTh: "", cleanEn: null });
    expect(parseBilingualProjectName("")).toEqual({ cleanTh: "", cleanEn: null });
  });

  describe("Business Rule: Multi-Language Project Name Selection", () => {
    const rawTh = "เดอะ โมนูเมนต์ ทองหล่อ (The Monument Thong Lo)";
    const { cleanTh, cleanEn } = parseBilingualProjectName(rawTh);

    it("in Thai mode, should show Thai on line 1 and English on line 2", () => {
      const line1 = cleanTh || cleanEn;
      const line2 = cleanEn && cleanEn !== cleanTh ? cleanEn : null;
      expect(line1).toBe("เดอะ โมนูเมนต์ ทองหล่อ");
      expect(line2).toBe("The Monument Thong Lo");
    });

    it("in non-Thai modes (en, cn, ru), should use English for all other languages", () => {
      const nonThaiLanguages = ["en", "cn", "ru"];
      for (const lang of nonThaiLanguages) {
        const displayName = lang === "th" ? (cleanTh || cleanEn) : (cleanEn || cleanTh);
        expect(displayName).toBe("The Monument Thong Lo");
      }
    });
  });
});
