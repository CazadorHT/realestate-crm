import { describe, it, expect } from "vitest";

describe("Popular Areas - Dynamic Locale Sort & Blank Filtering", () => {
  const sampleAreas = [
    { name: "พระราม 4", name_en: "Rama IV Road", name_cn: "拉玛四路", name_ru: "Рама 4", count: 2 },
    { name: "กรุงเทพกรีฑา", name_en: "Krungthep Kreetha", name_cn: "曼谷格里塔", name_ru: "Крунгтхеп Крита", count: 8 },
    { name: "บางนา", name_en: "Bang Na", name_cn: "邦纳", name_ru: "Банг На", count: 29 },
    { name: "เกษตร", name_en: "Kaset", name_cn: "农业", name_ru: "Касет", count: 2 },
    { name: "ทองหล่อ", name_en: "Thong Lo", name_cn: "通罗", name_ru: "Тхонг Ло", count: 7 },
    { name: "", name_en: "", name_cn: "", name_ru: "", count: 1 }, // Blank item
    { name: "   ", name_en: null, name_cn: null, name_ru: null, count: 1 }, // Whitespace item
  ];

  const getLocalizedName = (area: any, lang: string) => {
    if (lang === "en") return area.name_en || area.name;
    if (lang === "cn") return area.name_cn || area.name;
    if (lang === "ru") return area.name_ru || area.name;
    return area.name;
  };

  const processAreas = (areas: typeof sampleAreas, language: string) => {
    return areas
      .filter((a) => Boolean(a && a.name && a.name.trim() !== ""))
      .map((a) => ({ ...a, localizedName: getLocalizedName(a, language) }))
      .sort((a, b) => a.localizedName.localeCompare(b.localizedName, language === "th" ? "th" : language));
  };

  it("should filter out empty strings and whitespace items", () => {
    const result = processAreas(sampleAreas, "en");
    expect(result).toHaveLength(5);
    expect(result.some((a) => a.name.trim() === "")).toBe(false);
  });

  it("should sort alphabetically A-Z when language is English (en)", () => {
    const result = processAreas(sampleAreas, "en");
    const names = result.map((a) => a.localizedName);
    expect(names).toEqual([
      "Bang Na",
      "Kaset",
      "Krungthep Kreetha",
      "Rama IV Road",
      "Thong Lo",
    ]);
  });

  it("should sort alphabetically ก-ฮ when language is Thai (th)", () => {
    const result = processAreas(sampleAreas, "th");
    const names = result.map((a) => a.localizedName);
    expect(names).toEqual([
      "กรุงเทพกรีฑา",
      "เกษตร",
      "ทองหล่อ",
      "บางนา",
      "พระราม 4",
    ]);
  });

  describe("Multi-Select Area Filter Logic", () => {
    const toggleArea = (currentArea: string, areaName: string) => {
      const selected = currentArea === "ALL" ? [] : currentArea.split(",").map((s) => s.trim()).filter(Boolean);
      if (selected.includes(areaName)) {
        const next = selected.filter((s) => s !== areaName);
        return next.length > 0 ? next.join(",") : "ALL";
      } else {
        return [...selected, areaName].join(",");
      }
    };

    it("should toggle multiple areas correctly", () => {
      let area = "ALL";
      // 1. Select Bang Na
      area = toggleArea(area, "บางนา");
      expect(area).toBe("บางนา");

      // 2. Select Thong Lo
      area = toggleArea(area, "ทองหล่อ");
      expect(area).toBe("บางนา,ทองหล่อ");

      // 3. Deselect Bang Na
      area = toggleArea(area, "บางนา");
      expect(area).toBe("ทองหล่อ");

      // 4. Deselect Thong Lo -> resets to ALL
      area = toggleArea(area, "ทองหล่อ");
      expect(area).toBe("ALL");
    });

    it("should match properties with multi-area filter", () => {
      const mockProperties = [
        { id: "1", popular_area: "บางนา" },
        { id: "2", popular_area: "ทองหล่อ" },
        { id: "3", popular_area: "เกษตร" },
      ];

      const filterByArea = (props: typeof mockProperties, areaFilter: string) => {
        if (areaFilter === "ALL") return props;
        const selected = areaFilter.split(",").map((s) => s.trim()).filter(Boolean);
        return props.filter((p) => selected.includes(p.popular_area));
      };

      expect(filterByArea(mockProperties, "ALL")).toHaveLength(3);
      expect(filterByArea(mockProperties, "บางนา,ทองหล่อ")).toHaveLength(2);
      expect(filterByArea(mockProperties, "บางนา,ทองหล่อ").map((p) => p.id)).toEqual(["1", "2"]);
    });
  });

  describe("Area Hierarchy Tree & Count Aggregation", () => {
    it("should cluster child areas under parent and sum total counts", async () => {
      const { buildAreaHierarchy, expandAreaTokens } = await import("@/lib/utils/area-hierarchy");

      const inputAreas = [
        { name: "กรุงเทพกรีฑา", name_en: "Krungthep Kreetha", count: 8 },
        { name: "กรุงเทพกรีฑาตัดใหม่", name_en: "Krungthep Kreetha New Road", count: 2 },
        { name: "พระราม 4", name_en: "Rama IV Road", count: 2 },
        { name: "พระราม 4 - คลองเตย", name_en: "Rama 4 - Khlong Toei", count: 1 },
        { name: "ทองหล่อ", name_en: "Thong Lo", count: 7 },
      ];

      const tree = buildAreaHierarchy(inputAreas, "en");

      // 1. Top level should be grouped (กรุงเทพกรีฑา, พระราม 4, ทองหล่อ)
      const topLevelNames = tree.map((t) => t.localizedName);
      expect(topLevelNames).toContain("Krungthep Kreetha");
      expect(topLevelNames).toContain("Rama IV Road");
      expect(topLevelNames).toContain("Thong Lo");
      expect(topLevelNames).not.toContain("Krungthep Kreetha New Road");
      expect(topLevelNames).not.toContain("Rama 4 - Khlong Toei");

      // 2. Krungthep Kreetha parent total count should be 8 + 2 = 10
      const kkParent = tree.find((t) => t.name === "กรุงเทพกรีฑา");
      expect(kkParent).toBeDefined();
      expect(kkParent?.totalCount).toBe(10);
      expect(kkParent?.children).toHaveLength(1);
      expect(kkParent?.children[0].name).toBe("กรุงเทพกรีฑาตัดใหม่");

      // 3. Rama 4 parent total count should be 2 + 1 = 3
      const rama4Parent = tree.find((t) => t.name === "พระราม 4");
      expect(rama4Parent).toBeDefined();
      expect(rama4Parent?.totalCount).toBe(3);
      expect(rama4Parent?.children).toHaveLength(1);
      expect(rama4Parent?.children[0].name).toBe("พระราม 4 - คลองเตย");

      // 4. Token expansion: Selecting parent expands to include children
      const expandedKK = expandAreaTokens(["กรุงเทพกรีฑา"], tree);
      expect(expandedKK).toEqual(["กรุงเทพกรีฑา", "กรุงเทพกรีฑาตัดใหม่"]);

      // 5. Selecting child directly only returns that child
      const expandedChild = expandAreaTokens(["กรุงเทพกรีฑาตัดใหม่"], tree);
      expect(expandedChild).toEqual(["กรุงเทพกรีฑาตัดใหม่"]);
    });
  });
});
