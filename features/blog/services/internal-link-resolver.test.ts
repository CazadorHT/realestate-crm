import { describe, it, expect, vi } from "vitest";
import {
  resolveRelevantInternalLinks,
  resolveRelevantInternalLinksAndInsights,
} from "./internal-link-resolver";

const mockAreas = [
  { name: { th: "รัชดาภิเษก", en: "Ratchada" }, slug: "ratchada" },
  { name: { th: "สุขุมวิท", en: "Sukhumvit" }, slug: "sukhumvit" },
  { name: { th: "ทองหล่อ", en: "Thonglor" }, slug: "thonglor" },
];

const mockProjects = [
  { id: "proj-1", name: { th: "แอชตัน อโศก", en: "Ashton Asoke" }, slug: "ashton-asoke" },
  { id: "proj-2", name: { th: "ริธึ่ม เอกมัย", en: "Rhythm Ekkamai" }, slug: "rhythm-ekkamai" },
];

const mockStations = [
  { code: "BTS_ASOK", label: { th: "อโศก", en: "Asok" } },
  { code: "MRT_RAMA9", label: { th: "พระราม 9", en: "Phra Ram 9" } },
];

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: vi.fn(() => ({
    from: (table: string) => ({
      select: (_cols?: string, options?: any) => {
        const createQueryChain = (currentData: any, countVal: number) => {
          const chain: any = {
            eq: () => chain,
            is: () => chain,
            or: () => chain,
            in: () => chain,
            limit: () => Promise.resolve({ data: currentData, count: countVal, error: null }),
            then: (resolve: any) => resolve({ data: currentData, count: countVal, error: null }),
          };
          return chain;
        };

        if (table === "popular_areas_v3") {
          return {
            eq: () => Promise.resolve({ data: mockAreas, error: null }),
          };
        }
        if (table === "projects") {
          return {
            eq: () => ({
              limit: () => Promise.resolve({ data: mockProjects, error: null }),
            }),
          };
        }
        if (table === "ref_master_data") {
          return {
            eq: () => ({
              eq: () => Promise.resolve({ data: mockStations, error: null }),
            }),
          };
        }
        if (table === "properties") {
          const mockProps = [
            { id: "p1", rental_price: 25000, price: 5500000 },
            { id: "p2", rental_price: 45000, price: 9500000 },
          ];
          return createQueryChain(mockProps, mockProps.length);
        }
        return createQueryChain([], 0);
      },
    }),
  })),
}));

describe("Smart Internal Link Resolver & Live Inventory Insights", () => {
  it("should match office silo and real ratchada area from DB with live inventory", async () => {
    const links = await resolveRelevantInternalLinks("คู่มือเลือกออฟฟิศย่านรัชดา");

    // Should include Office hub
    const hasOfficeHub = links.some((l) => l.url === "/properties/office-for-rent");
    expect(hasOfficeHub).toBe(true);

    // Should include verified real Ratchada area
    const hasRatchada = links.some((l) => l.url === "/areas/ratchada");
    expect(hasRatchada).toBe(true);

    // Should include a contact/consultation CTA
    const hasCta = links.some((l) => l.url === "/contact");
    expect(hasCta).toBe(true);
  });

  it("should generate live market insights snapshot for prompt injection", async () => {
    const result = await resolveRelevantInternalLinksAndInsights("เช่าคอนโด ย่านรัชดาภิเษก");

    expect(result.inventoryCount).toBeGreaterThan(0);
    expect(result.marketInsightsText).toBeDefined();
    expect(result.marketInsightsText).toContain("รัชดาภิเษก");
    expect(result.marketInsightsText).toContain("ช่วงราคาเช่าจริง");
  });

  it("should NOT hallucinate non-existent areas (e.g. 'เชียงดาว' not in DB)", async () => {
    const links = await resolveRelevantInternalLinks("บ้านพักตากอากาศเชียงดาว");

    const hasFakeArea = links.some((l) => l.url.includes("chiang-dao") || l.url.includes("เชียงดาว"));
    expect(hasFakeArea).toBe(false);
  });

  it("should match pet-friendly hub for pet condo keywords", async () => {
    const links = await resolveRelevantInternalLinks("คอนโดเลี้ยงสัตว์ได้ ใกล้ BTS");

    const hasPetHub = links.some((l) => l.url === "/properties/pet-friendly-condo");
    expect(hasPetHub).toBe(true);
  });

  it("should match verified real projects if mentioned in topic (e.g. 'Ashton Asoke')", async () => {
    const links = await resolveRelevantInternalLinks("รีวิวคอนโด Ashton Asoke น่าอยู่ไหม");

    const hasProjectLink = links.some((l) => l.url === "/projects/ashton-asoke");
    expect(hasProjectLink).toBe(true);
  });
});
