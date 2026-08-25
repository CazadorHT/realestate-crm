import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractPropertyFromDepositAction } from "./ai-deposit-extractor";

vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn().mockResolvedValue({
    role: "STAFF",
  }),
  assertStaff: vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateText: vi.fn(),
}));

vi.mock("@/features/ai-settings/actions", () => ({
  getAiModelConfig: vi.fn().mockResolvedValue({
    description_model: "gemini-2.5-flash",
  }),
}));

vi.mock("@/features/ai-monitor/actions", () => ({
  logAiUsage: vi.fn().mockResolvedValue(true),
}));

import { generateText } from "@/lib/ai/gemini";

describe("extractPropertyFromDepositAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse structured property fields from raw deposit text", async () => {
    const mockAiResponse = {
      text: JSON.stringify({
        title: "The Niche ID Rama 2",
        property_type: "CONDO",
        listing_type: "SALE",
        price: 1890000,
        rental_price: null,
        bedrooms: 1,
        bathrooms: 1,
        size_sqm: 30,
        floor: 15,
        features: ["สระว่ายน้ำ", "ฟิตเนส"],
        description: "คอนโดสภาพดี พร้อมอยู่",
      }),
      usage: { promptTokens: 100, completionTokens: 50 },
    };

    (generateText as any).mockResolvedValue(mockAiResponse);

    const rawNote = "ขายคอนโด The Niche ID Rama 2 ขนาด 30 ตร.ม. 1 นอน 1 น้ำ ราคา 1.89 ล้าน ชั้น 15";
    const result = await extractPropertyFromDepositAction(rawNote);

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("The Niche ID Rama 2");
    expect(result.data?.property_type).toBe("CONDO");
    expect(result.data?.price).toBe(1890000);
    expect(result.data?.size_sqm).toBe(30);
    expect(result.data?.bedrooms).toBe(1);
    expect(result.data?.floor).toBe(15);
    expect(result.data?.features).toContain("สระว่ายน้ำ");
  });

  it("should handle markdown json wrap properly", async () => {
    const mockAiResponse = {
      text: "```json\n" + JSON.stringify({
        title: "Sukhumvit House",
        property_type: "HOUSE",
        listing_type: "RENT",
        rental_price: 65000,
      }) + "\n```",
    };

    (generateText as any).mockResolvedValue(mockAiResponse);

    const result = await extractPropertyFromDepositAction("House for rent in Sukhumvit 65k/mo");

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("Sukhumvit House");
    expect(result.data?.property_type).toBe("HOUSE");
    expect(result.data?.rental_price).toBe(65000);
  });
});
