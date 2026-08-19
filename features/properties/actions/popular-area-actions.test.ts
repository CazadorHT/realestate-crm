import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkPopularAreaExistsAction,
  translateAreaNameAction,
  savePopularAreaAction,
} from "./popular-area-actions";

// Mock Supabase
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockSingle }));
const mockOr = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ or: mockOr }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));

const mockFrom = vi.fn((table: string) => {
  if (table === "popular_areas_v3") {
    return {
      select: mockSelect,
      upsert: mockUpsert,
    };
  }
  return {};
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => mockFrom(table),
  }),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/ai/translation-actions", () => ({
  translateTextAction: vi.fn().mockResolvedValue({
    en: "Bang Lamung",
    cn: "挽腊茫",
    ru: "Бангламунг",
  }),
}));

describe("Popular Area Actions (features/properties/actions/popular-area-actions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkPopularAreaExistsAction", () => {
    it("should return false if province or areaName is empty", async () => {
      const res = await checkPopularAreaExistsAction("", "บางละมุง");
      expect(res.exists).toBe(false);

      const res2 = await checkPopularAreaExistsAction("ชลบุรี", "");
      expect(res2.exists).toBe(false);
    });

    it("should return true when area exists in popular_areas_v3", async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "area-123",
          name: { th: "บางละมุง", en: "Bang Lamung" },
          province: "ชลบุรี",
        },
        error: null,
      });

      const res = await checkPopularAreaExistsAction("ชลบุรี", "บางละมุง");
      expect(res.exists).toBe(true);
      expect(res.data?.id).toBe("area-123");
    });

    it("should return false when area does not exist", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await checkPopularAreaExistsAction("ชลบุรี", "ทำเลใหม่เอี่ยม");
      expect(res.exists).toBe(false);
    });
  });

  describe("translateAreaNameAction", () => {
    it("should return empty translations if nameTh is empty", async () => {
      const res = await translateAreaNameAction("");
      expect(res).toEqual({ en: "", cn: "", ru: "" });
    });

    it("should call AI translation and return 3 languages", async () => {
      const res = await translateAreaNameAction("บางละมุง");
      expect(res.en).toBe("Bang Lamung");
      expect(res.cn).toBe("挽腊茫");
      expect(res.ru).toBe("Бангламунг");
    });
  });

  describe("savePopularAreaAction", () => {
    it("should fail if nameTh or province is missing", async () => {
      const res = await savePopularAreaAction({
        province: "",
        nameTh: "บางละมุง",
        nameEn: "Bang Lamung",
        nameCn: "",
        nameRu: "",
      });
      expect(res.success).toBe(false);
    });

    it("should upsert into popular_areas_v3 with multilingual payload and slug", async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "new-area-id",
          slug: "bang-lamung",
          name: {
            th: "บางละมุง",
            en: "Bang Lamung",
            cn: "挽腊茫",
            ru: "Бангламунг",
            default: "บางละมุง",
          },
          province: "ชลบุรี",
        },
        error: null,
      });

      const res = await savePopularAreaAction({
        province: "ชลบุรี",
        nameTh: "บางละมุง",
        nameEn: "Bang Lamung",
        nameCn: "挽腊茫",
        nameRu: "Бангламунг",
      });

      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("new-area-id");
      expect(mockUpsert).toHaveBeenCalled();
    });
  });
});
