import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Blogs Module - Bulk Actions (เทสโหดๆ แบบไม่อวย)", () => {
  let bulkDeleteBlogsAction: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/authz", () => ({
      requireAuthContext: vi.fn().mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        role: "ADMIN",
        tenantId: "tenant-1",
      }),
      assertStaff: vi.fn(),
    }));

    vi.doMock("@/lib/audit", () => ({
      logAudit: vi.fn().mockResolvedValue({ success: true }),
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    const actions = await import("./bulk-actions");
    bulkDeleteBlogsAction = actions.bulkDeleteBlogsAction;
  });

  it("should successfully bulk delete blogs and log audit", async () => {
    mockSupabase.mockTableResult("cms_content_v3", [], 2);

    const result = await bulkDeleteBlogsAction(["blog1", "blog2"]);
    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);
    expect(mockSupabase.delete).toHaveBeenCalled();
  });

  it("should handle empty array gracefully without calling database", async () => {
    const result = await bulkDeleteBlogsAction([]);
    expect(result.success).toBe(false);
    expect(result.message).toContain("ไม่มีรายการ");
    expect(mockSupabase.delete).not.toHaveBeenCalled();
  });

  it("should handle database errors during bulk deletion gracefully", async () => {
    mockSupabase.mockTableError("cms_content_v3", new Error("DB_DELETE_ERROR"));

    const result = await bulkDeleteBlogsAction(["blog1"]);
    expect(result.success).toBe(false);
    expect(result.message).toContain("DB_DELETE_ERROR");
  });
});
