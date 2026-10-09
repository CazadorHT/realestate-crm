import { describe, it, expect, vi } from "vitest";
import { getBlogContextualProperties } from "./blog-property-matcher";

vi.mock("@/lib/services/properties", () => ({
  getPublicProperties: vi.fn(async (options: any) => {
    if (options?.propertyType === "OFFICE_BUILDING") {
      return {
        properties: [
          { id: "prop-office-1", title: "Modern Office Ratchada", property_type: "OFFICE_BUILDING" },
        ],
      };
    }
    if (options?.petFriendly) {
      return {
        properties: [
          { id: "prop-pet-1", title: "Pet Friendly Condo Sukhumvit", is_pet_friendly: true },
        ],
      };
    }
    return {
      properties: [
        { id: "prop-default-1", title: "Prime Condo Bangkok" },
        { id: "prop-default-2", title: "Luxury House Ari" },
      ],
    };
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: [
            { name: "รัชดาภิเษก", name_en: "Ratchada", slug: "ratchada" },
            { name: "สุขุมวิท", name_en: "Sukhumvit", slug: "sukhumvit" },
          ],
        }),
      }),
    }),
  })),
}));

describe("Blog Contextual Property Matcher", () => {
  it("should detect Office intent and match office properties", async () => {
    const post = {
      title: "คู่มือเลือกเช่าออฟฟิศทำเลทอง",
      tags: ["ออฟฟิศ", "ธุรกิจ"],
      category: "การลงทุนอสังหาฯ",
    };

    const result = await getBlogContextualProperties(post, 2);
    expect(result.matchedType).toBe("OFFICE");
    expect(result.contextTitleTh).toContain("ออฟฟิศ");
    expect(result.properties.some((p) => p.id === "prop-office-1")).toBe(true);
  });

  it("should detect Pet Friendly intent and set appropriate title", async () => {
    const post = {
      title: "รวมคอนโดเลี้ยงสัตว์ได้ ใกล้รถไฟฟ้า",
      tags: ["คอนโด", "สัตว์เลี้ยง"],
      category: "ไลฟ์สไตล์",
    };

    const result = await getBlogContextualProperties(post, 2);
    expect(result.matchedType).toBe("PET_FRIENDLY");
    expect(result.contextTitleTh).toContain("เลี้ยงสัตว์");
    expect(result.properties.some((p) => p.id === "prop-pet-1")).toBe(true);
  });

  it("should detect Area Ratchada correctly from colloquial name", async () => {
    const post = {
      title: "รีวิวคอนโดย่านรัชดา น่าอยู่แค่ไหน",
      tags: ["คอนโด"],
      category: "รีวิวทำเล",
    };

    const result = await getBlogContextualProperties(post, 2);
    expect(result.matchedArea).toBe("รัชดาภิเษก");
    expect(result.contextTitleTh).toContain("รัชดาภิเษก");
  });
});
