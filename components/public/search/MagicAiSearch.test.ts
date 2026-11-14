import { describe, expect, it } from "vitest";

describe("MagicAiSearch Bilingual Project Suggestions", () => {
  function getSuggestionDisplayInfo(
    item: {
      text: string;
      label: string;
      translations?: { th?: string; en?: string; cn?: string; ru?: string };
    },
    lang: string,
    currentInput: string
  ) {
    const q = currentInput.trim().toLowerCase();
    const th = item.translations?.th || item.text;
    const en = item.translations?.en || "";
    const hasDifferentEn = Boolean(en && en.toLowerCase() !== th.toLowerCase());

    const isInputEnglish = Boolean(q && /^[a-z0-9\s\-_,&().'/]+$/i.test(q));
    const matchesEn = Boolean(q && en && en.toLowerCase().includes(q));
    const preferEn = matchesEn || (isInputEnglish && hasDifferentEn);

    if (lang === "th") {
      if (preferEn) {
        return {
          primary: en || th,
          secondary: hasDifferentEn ? th : null,
          valueToSelect: en || th,
        };
      }
      return {
        primary: th,
        secondary: hasDifferentEn ? en : null,
        valueToSelect: th,
      };
    }

    if (lang === "en") {
      return {
        primary: en || th,
        secondary: null,
        valueToSelect: en || th,
      };
    }

    return {
      primary: item.text,
      secondary: null,
      valueToSelect: item.text,
    };
  }

  const projectItem = {
    text: "บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว",
    label: "โครงการ",
    translations: {
      th: "บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว",
      en: "Baan Klang Muang S-Sense Rama 9 - Ladprao",
    },
  };

  it("shows English project name as primary when user types English in Thai site", () => {
    const info = getSuggestionDisplayInfo(projectItem, "th", "Baan Klang");
    expect(info.primary).toBe("Baan Klang Muang S-Sense Rama 9 - Ladprao");
    expect(info.secondary).toBe("บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว");
    expect(info.valueToSelect).toBe("Baan Klang Muang S-Sense Rama 9 - Ladprao");
  });

  it("shows Thai project name as primary and English as secondary when browsing empty in Thai site", () => {
    const info = getSuggestionDisplayInfo(projectItem, "th", "");
    expect(info.primary).toBe("บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว");
    expect(info.secondary).toBe("Baan Klang Muang S-Sense Rama 9 - Ladprao");
    expect(info.valueToSelect).toBe("บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว");
  });

  it("shows Thai project name as primary and English as secondary when user types Thai in Thai site", () => {
    const info = getSuggestionDisplayInfo(projectItem, "th", "บ้านกลางเมือง");
    expect(info.primary).toBe("บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว");
    expect(info.secondary).toBe("Baan Klang Muang S-Sense Rama 9 - Ladprao");
    expect(info.valueToSelect).toBe("บ้านกลางเมือง เอสเซ้นส์ พระราม 9 - ลาดพร้าว");
  });

  it("does not show duplicate secondary if Thai and English names are identical", () => {
    const condoItem = {
      text: "The Line Sukhumvit 71",
      label: "โครงการ",
      translations: {
        th: "The Line Sukhumvit 71",
        en: "The Line Sukhumvit 71",
      },
    };
    const info = getSuggestionDisplayInfo(condoItem, "th", "The Line");
    expect(info.primary).toBe("The Line Sukhumvit 71");
    expect(info.secondary).toBeNull();
  });

  it("shows only 1 line (secondary is null) for English website", () => {
    const info = getSuggestionDisplayInfo(projectItem, "en", "Baan Klang");
    expect(info.primary).toBe("Baan Klang Muang S-Sense Rama 9 - Ladprao");
    expect(info.secondary).toBeNull();
  });
});
