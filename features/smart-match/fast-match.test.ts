import { describe, it, expect, vi, beforeEach } from "vitest";
import { fastMatchChatAction } from "./fast-match-action";
import { generateText } from "@/lib/ai/gemini";

// Mock lib/ai/gemini
vi.mock("@/lib/ai/gemini", () => ({
  generateText: vi.fn(),
}));

// Mock lib/authz
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn().mockResolvedValue({
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: "prop-1",
              title: "The Crest Sukhumvit 34",
              rental_price: 85000,
              price: null,
              bedrooms: 2,
              bathrooms: 2,
              size_sqm: 98,
              land_size_sqwah: null,
              district: "เขตคลองเตย",
              subdistrict: "คลองตัน",
              popular_area: "สุขุมวิท",
              address_line1: "สุขุมวิท 34",
              property_type: "CONDO",
              description: "คอนโดหรู ใกล้ BTS ทองหล่อ",
              images: "[\"https://example.com/crest.jpg\"]",
              slug: "crest-34",
              is_pet_friendly: false,
            },
            {
              id: "prop-2",
              title: "Varenzia คลองตันนิเวศ",
              rental_price: 75000,
              price: null,
              bedrooms: 3,
              bathrooms: 4,
              size_sqm: 192,
              land_size_sqwah: 35,
              district: "เขตวัฒนา",
              subdistrict: "พระโขนงเหนือ",
              popular_area: "สุขุมวิท",
              address_line1: "ปรีดีพนมยงค์ 42",
              property_type: "TOWNHOME",
              description: "ทาวน์เฮาส์หรู ที่จอดรถ 3 คัน ครัวกว้าง",
              images: "[\"https://example.com/varenzia.jpg\"]",
              slug: "varenzia",
              is_pet_friendly: true,
            },
          ],
          error: null,
        }),
      }),
    },
    role: "ADMIN",
  }),
  assertStaff: vi.fn(),
}));

describe("Fast Match Chat Action - ท่าแปลกๆ & Edge Cases Test Suite", () => {
  const mockGenerateText = vi.mocked(generateText);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------
  // ท่าที่ 1: ข้อความว่างเปล่า / มีแต่ Whitespace
  // -------------------------------------------------------------
  it("ท่าที่ 1: ควรปฏิเสธข้อความว่างเปล่าหรือมีแต่ space อย่างปลอดภัย", async () => {
    const res = await fastMatchChatAction("     \n\t   ");
    expect(res.success).toBe(false);
    expect(res.error).toContain("กรุณาระบุข้อความ");
  });

  // -------------------------------------------------------------
  // ท่าที่ 2: ข้อความสั้นกุด มีแต่คีย์เวิร์ด (Minimalist / Shorthand)
  // -------------------------------------------------------------
  it("ท่าที่ 2: รองรับข้อความสั้นกุด เช่น 'พร้อมพงษ์ 2 นอน 60k'", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "ลูกค้า",
            purpose: "RENT",
            budget_max: 60000,
            budget_min: null,
            size_min_sqm: null,
            bedrooms_min: 2,
            target_zones: ["พร้อมพงษ์", "สุขุมวิท", "คลองเตย"],
            property_types: ["CONDO"],
            soft_conditions: ["ด่วน"],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: "🏢 ตัวเลือกคอนโดพร้อมพงษ์ที่แนะนำ...",
      });

    const res = await fastMatchChatAction("พร้อมพงษ์ 2 นอน 60k");
    expect(res.success).toBe(true);
    expect(res.text).toBeDefined();
    expect(res.parsedCases?.[0].budget_max).toBe(60000);
    expect(res.parsedCases?.[0].bedrooms_min).toBe(2);
  });

  // -------------------------------------------------------------
  // ท่าที่ 3: ข้อความภาษาอังกฤษล้วน (Expat / Foreigner)
  // -------------------------------------------------------------
  it("ท่าที่ 3: รองรับข้อความภาษาอังกฤษล้วนจาก Expat / Foreigner", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "Expat Client",
            purpose: "RENT",
            budget_max: 85000,
            budget_min: 70000,
            size_min_sqm: 90,
            bedrooms_min: 2,
            target_zones: ["สุขุมวิท", "ทองหล่อ", "พร้อมพงษ์", "เอกมัย"],
            property_types: ["CONDO", "TOWNHOME"],
            soft_conditions: ["1 golden retriever", "move in end of month"],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: "🏢 Recommended Options for Expat Client in Sukhumvit...",
      });

    const input =
      "Expat client looking for 2-3 bed condo in Sukhumvit/Thonglor/Phrom Phong, budget around 70k-85k, 90sqm+, pet friendly (1 golden retriever), move in end of month";
    const res = await fastMatchChatAction(input, "en");

    expect(res.success).toBe(true);
    expect(res.text).toContain("Recommended Options");
    expect(res.parsedCases?.[0].budget_max).toBe(85000);
    expect(res.parsedCases?.[0].soft_conditions).toContain("1 golden retriever");
  });

  // -------------------------------------------------------------
  // ท่าที่ 4: สลับงบ Min กับ Max (Inverted Range: 100k - 70k)
  // -------------------------------------------------------------
  it("ท่าที่ 4: สลับงบ Min กับ Max ให้ถูกต้องอัตโนมัติ (Inverted Budget)", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "ลูกค้าสลับงบ",
            purpose: "RENT",
            budget_max: 70000,
            budget_min: 100000, // Inverted! Min > Max
            size_min_sqm: null,
            bedrooms_min: 3,
            target_zones: ["ลาดพร้าว"],
            property_types: ["HOUSE"],
            soft_conditions: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: "🏡 ตัวเลือกบ้านเดี่ยวลาดพร้าว...",
      });

    const res = await fastMatchChatAction("งบ 100k - 70k หาบ้านเดี่ยวลาดพร้าว 3 นอน");
    expect(res.success).toBe(true);
    // Should be swapped in normalized parsed case
    expect(res.parsedCases?.[0].budget_min).toBe(70000);
    expect(res.parsedCases?.[0].budget_max).toBe(100000);
  });

  // -------------------------------------------------------------
  // ท่าที่ 5: ข้อความขยะจาก LINE (Timestamps, Emojis, Forwarded headers)
  // -------------------------------------------------------------
  it("ท่าที่ 5: จัดการข้อความ Forwarded จาก LINE ที่มี Emojis และ Timestamps ได้สบาย", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "ลค.วีไอพี พี่หมู",
            purpose: "RENT",
            budget_max: 80000,
            budget_min: null,
            size_min_sqm: null,
            bedrooms_min: 3,
            target_zones: ["เอกมัย", "สุขุมวิท", "วัฒนา"],
            property_types: ["TOWNHOME", "HOUSE"],
            soft_conditions: ["ที่จอดรถเยอะๆ"],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: "💡 ตัวเลือกทาวน์โฮมเอกมัยที่จอดรถเยอะ...",
      });

    const input = `[LINE] 14:35 น. พี่หมู เอเจนต์: 
🏡🛎️ด่วนนนนน‼️‼️ ลค.วีไอพี หาเช่าทาวน์โฮม เอกมัย 80,000 บ. 3 นอน ขอที่จอดรถเยอะๆๆๆๆ 🙏🙏‼️‼️`;

    const res = await fastMatchChatAction(input);
    expect(res.success).toBe(true);
    expect(res.parsedCases?.[0].target_zones).toContain("เอกมัย");
  });

  // -------------------------------------------------------------
  // ท่าที่ 6: AI ส่ง JSON ติด Code fences (```json ... ```)
  // -------------------------------------------------------------
  it("ท่าที่ 6: ถอดรหัส JSON ได้แม้ AI ใส่ Markdown Code Fences ครอบมา", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: "```json\n[{\n  \"client_label\": \"เคส 1\",\n  \"purpose\": \"RENT\",\n  \"budget_max\": 50000,\n  \"target_zones\": [\"อารีย์\"]\n}]\n```",
      })
      .mockResolvedValueOnce({
        text: "🏢 แนะนำคอนโดอารีย์...",
      });

    const res = await fastMatchChatAction("หาคอนโดอารีย์ 50k");
    expect(res.success).toBe(true);
    expect(res.parsedCases?.[0].target_zones).toContain("อารีย์");
  });

  // -------------------------------------------------------------
  // ท่าที่ 7: ส่งมาหลายเคสปนกัน (Multi-case Matching)
  // -------------------------------------------------------------
  it("ท่าที่ 7: แยกแยะและตอบหลายเคสในข้อความเดียวได้อย่างถูกต้อง", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "เคส 1",
            purpose: "RENT",
            budget_max: 30000,
            target_zones: ["อโศก"],
            property_types: ["CONDO"],
          },
          {
            client_label: "เคส 2",
            purpose: "BUY",
            budget_max: 25000000,
            target_zones: ["กรุงเทพกรีฑา"],
            property_types: ["HOUSE"],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: "🏢 เคส 1: คอนโดอโศก 30k...",
      })
      .mockResolvedValueOnce({
        text: "🏡 เคส 2: บ้านเดี่ยวกรุงเทพกรีฑา 25 ล้าน...",
      });

    const input = `เคส 1: เช่าคอนโดอโศก 30k
เคส 2: ซื้อบ้านเดี่ยวกรุงเทพกรีฑา 25 ล้าน`;

    const res = await fastMatchChatAction(input);
    expect(res.success).toBe(true);
    expect(res.parsedCases?.length).toBe(2);
    expect(res.text).toContain("เคส 1");
    expect(res.text).toContain("เคส 2");
  });

  // -------------------------------------------------------------
  // ท่าที่ 8: ข้อความไม่มีข้อมูลอสังหาฯ เลย (Garbage / gibberish)
  // -------------------------------------------------------------
  it("ท่าที่ 8: แจ้งเตือนสุภาพเมื่อข้อความไม่มีความต้องการอสังหาฯ เลย", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "[]", // AI finds no property intent
    });

    const res = await fastMatchChatAction("สวัสดีครับ สบายดีไหม วันนี้กินข้าวหรือยัง");
    expect(res.success).toBe(false);
    expect(res.error).toContain("ไม่พบข้อมูลความต้องการ");
  });

  // -------------------------------------------------------------
  // ท่าที่ 9: คัดกรองแม่นยำ ไม่ดึงโซนชานเมือง (เช่น บางนา) หรือประเภทผิดเมื่อหาคอนโด
  // -------------------------------------------------------------
  it("ท่าที่ 9: ป้องกันโซนชานเมืองและประเภทผิดหลุดเข้ามาในการค้นหาคอนโดใจกลางเมือง", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "ลูกค้าทองหล่อ",
            purpose: "RENT",
            budget_max: 80000,
            budget_min: 70000,
            bedrooms_min: 1,
            bedrooms_max: 2,
            target_zones: ["ทองหล่อ", "สุขุมวิท", "วัฒนา"],
            property_types: ["CONDO", "APARTMENT"],
            soft_conditions: ["ตึกใหม่", "น้ำแรง"],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          selected_ids: ["prop-1"],
          pitch_message: "1️⃣ The Crest Sukhumvit 34 (ตรงโจทย์คอนโดหรู)...",
        }),
      });

    const res = await fastMatchChatAction("คอนโดให้เช่าย่านทองหล่อ งบ 70-80k 1-2 นอน");
    expect(res.success).toBe(true);
    expect(res.matchedProperties).toBeDefined();
    expect(res.matchedProperties?.[0]?.id).toBe("prop-1");
  });

  // -------------------------------------------------------------
  // ท่าที่ 10: ค้นหาด้วยชื่อสถานีรถไฟฟ้า (BTS / MRT / Transit Station)
  // -------------------------------------------------------------
  it("ท่าที่ 10: ค้นหาด้วยชื่อสถานี BTS/MRT ได้แม่นยำ พร้อมถอดชื่อสถานี", async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        text: JSON.stringify([
          {
            client_label: "ลูกค้าใกล้ BTS",
            purpose: "RENT",
            budget_max: 85000,
            budget_min: null,
            bedrooms_min: 2,
            matched_popular_areas: ["ทองหล่อ", "สุขุมวิท"],
            transit_stations: ["ทองหล่อ"],
            target_zones: ["ทองหล่อ", "สุขุมวิท"],
            property_types: ["CONDO"],
            soft_conditions: ["ใกล้ BTS เดินได้"],
          },
        ]),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          selected_ids: ["prop-1"],
          pitch_message: "1️⃣ The Crest Sukhumvit 34 (ใกล้ BTS ทองหล่อ 350 ม.)...",
        }),
      });

    const res = await fastMatchChatAction("หาคอนโด 2 นอน ใกล้ BTS ทองหล่อ เดินได้ งบไม่เกิน 85k");
    expect(res.success).toBe(true);
    expect(res.matchedProperties?.[0]?.id).toBe("prop-1");
  });
});
