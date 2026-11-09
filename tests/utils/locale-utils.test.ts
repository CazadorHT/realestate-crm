import { describe, it, expect } from "vitest";
import { getLocaleValue, getLocalizedAreaName } from "@/lib/utils/locale-utils";

describe("getLocaleValue Unit Tests", () => {
  it("should return the requested locale from a multilingual JSONB object", () => {
    const data = {
      name: {
        th: "ทองหล่อ",
        en: "Thong Lo",
        cn: "通罗",
        ru: "Тхонг Ло",
      },
    };

    expect(getLocaleValue(data, "name", "th")).toBe("ทองหล่อ");
    expect(getLocaleValue(data, "name", "en")).toBe("Thong Lo");
    expect(getLocaleValue(data, "name", "cn")).toBe("通罗");
    expect(getLocaleValue(data, "name", "zh")).toBe("通罗");
    expect(getLocaleValue(data, "name", "ru")).toBe("Тхонг Ло");
  });

  it("should fallback to English if specific locale is missing from object", () => {
    const data = {
      name: {
        th: "พร้อมพงษ์",
        en: "Phrom Phong",
      },
    };

    expect(getLocaleValue(data, "name", "cn")).toBe("Phrom Phong");
    expect(getLocaleValue(data, "name", "ru")).toBe("Phrom Phong");
  });

  it("should return localized area name from dictionary fallback if not in raw data", () => {
    expect(getLocalizedAreaName("ทองหล่อ", "th")).toBe("ทองหล่อ");
    expect(getLocalizedAreaName("ทองหล่อ", "en")).toBe("Thong Lo");
    expect(getLocalizedAreaName("ทองหล่อ", "cn")).toBe("通罗");
    expect(getLocalizedAreaName("ทองหล่อ", "ru")).toBe("Тхонг Ло");
  });

  it("should handle null and undefined safely", () => {
    expect(getLocaleValue(null, "name", "en")).toBe("");
    expect(getLocaleValue(undefined, "name", "th")).toBe("");
    expect(getLocalizedAreaName(null, "en")).toBe("");
  });
});
