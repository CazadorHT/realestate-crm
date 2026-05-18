import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("LINE Manager Module - Actions (เทสโหดๆ แบบไม่อวย)", () => {
  let getLineTemplates: any;
  let updateLineTemplate: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    const actions = await import("./actions");
    getLineTemplates = actions.getLineTemplates;
    updateLineTemplate = actions.updateLineTemplate;
  });

  describe("getLineTemplates", () => {
    it("should successfully fetch line templates", async () => {
      mockSupabase.mockTableResult("line_templates", [
        { key: "WELCOME", label: "Welcome Message", is_active: true, config: {} },
      ]);

      const templates = await getLineTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].key).toBe("WELCOME");
    });

    it("should handle error and return empty array", async () => {
      mockSupabase.mockTableError("line_templates", new Error("DB_ERROR"));

      const templates = await getLineTemplates();
      expect(templates).toEqual([]);
    });
  });

  describe("updateLineTemplate", () => {
    it("should successfully update line template", async () => {
      mockSupabase.mockTableResult("line_templates", { success: true });

      const result = await updateLineTemplate("WELCOME", { is_active: false });
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_active: false });
    });

    it("should throw error if update fails", async () => {
      mockSupabase.mockTableError("line_templates", new Error("UPDATE_FAILED"));

      await expect(updateLineTemplate("WELCOME", { is_active: false })).rejects.toThrow("Failed to update template");
    });
  });
});
