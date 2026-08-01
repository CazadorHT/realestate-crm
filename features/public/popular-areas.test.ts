import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Public Data - Popular Areas (เทสโหดๆ แบบไม่อวย)", () => {
  let getPublicProvincesAction: any;
  let getPopularAreasAction: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
      createPublicClient: vi.fn().mockReturnValue(mockSupabase),
    }));

    vi.doMock("next/cache", () => ({
      unstable_cache: vi.fn((cb) => cb), // Bypass cache wrapper for direct testing
    }));

    const actions = await import("./popular-areas");
    getPublicProvincesAction = actions.getPublicProvincesAction;
    getPopularAreasAction = actions.getPopularAreasAction;
  });

  describe("getPublicProvincesAction", () => {
    it("should fetch unique provinces and map display names correctly", async () => {
      mockSupabase.mockTableResult("properties", [
        { province: "กรุงเทพมหานคร" },
        { province: "ภูเก็ต" },
        { province: "กรุงเทพมหานคร" }, // Duplicate
        { province: "เชียงใหม่" },
      ]);

      const provinces = await getPublicProvincesAction();
      expect(provinces).toHaveLength(3);
      expect(provinces).toEqual([
        { id: "กรุงเทพมหานคร", display: "Bangkok" },
        { id: "ภูเก็ต", display: "Phuket" },
        { id: "เชียงใหม่", display: "Chiang Mai" },
      ]);
    });

    it("should handle error and return empty array", async () => {
      mockSupabase.mockTableError("properties", new Error("DB_ERROR"));

      const provinces = await getPublicProvincesAction();
      expect(provinces).toEqual([]);
    });
  });

  describe("getPopularAreasAction", () => {
    it("should return admin mode area names when onlyActive is false", async () => {
      mockSupabase.mockTableResult("popular_areas_v3", [{ name: "Asoke" }, { name: "Thonglor" }]);

      const areas = await getPopularAreasAction({ onlyActive: false });
      expect(areas).toEqual(["Asoke", "Thonglor"]);
    });

    it("should aggregate popular areas with cover images in public mode", async () => {
      mockSupabase
        .mockTableResult("mv_project_property_stats", [
          { primary_popular_area: "Asoke", property_count: 2, price_min: 5000000, rental_min: 20000 },
          { primary_popular_area: "Thonglor", property_count: 1, price_min: 8000000, rental_min: 35000 },
        ])
        .mockTableResult("popular_areas_v3", [
          { id: "a1", name: { th: "Asoke", en: "Asoke" }, slug: "asoke", image_url: "http://img.com/asoke.jpg", province: "กรุงเทพมหานคร", is_active: true },
          { id: "a2", name: { th: "Thonglor", en: "Thonglor" }, slug: "thonglor", image_url: "http://img.com/thonglor.jpg", province: "กรุงเทพมหานคร", is_active: true },
        ]);

      const areas = await getPopularAreasAction("Bangkok");
      expect(areas).toHaveLength(2);
      expect(areas[0].name).toBe("Asoke");
      expect(areas[0].count).toBe(2); // 2 properties in Asoke
      expect(areas[0].cover).toBe("http://img.com/asoke.jpg");

      expect(areas[1].name).toBe("Thonglor");
      expect(areas[1].count).toBe(1);
    });

    it("should return empty array if no active properties found", async () => {
      mockSupabase.mockTableResult("properties", []);

      const areas = await getPopularAreasAction();
      expect(areas).toEqual([]);
    });

    it("should handle error gracefully in public mode", async () => {
      mockSupabase.mockTableError("properties", new Error("PROP_ERROR"));

      const areas = await getPopularAreasAction();
      expect(areas).toEqual([]);
    });
  });
});
