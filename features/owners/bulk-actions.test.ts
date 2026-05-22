import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Owners Module - Bulk Delete Actions", () => {
  let bulkDeleteOwnersAction: any;
  let requireAuthContextMock: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    requireAuthContextMock = vi.fn().mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "u1" },
      role: "ADMIN",
      tenantId: "tenant-1",
    });

    vi.doMock("@/lib/authz", () => ({
      requireAuthContext: requireAuthContextMock,
      assertStaff: vi.fn(),
    }));

    vi.doMock("@/lib/actions/system-config", () => ({
      getSystemConfig: vi.fn().mockResolvedValue({
        multi_tenant_enabled: true,
        default_tenant_id: "tenant-1",
      }),
    }));

    vi.doMock("@/lib/audit", () => ({
      logAudit: vi.fn().mockResolvedValue({ success: true }),
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    const actions = await import("./bulk-actions");
    bulkDeleteOwnersAction = actions.bulkDeleteOwnersAction;
  });

  it("should successfully delete safe owners and their memberships", async () => {
    // 1. Fetching existing owners
    mockSupabase.mockTableResult("identities_v3", [
      { id: "owner-1", tenant_id: "tenant-1" },
      { id: "owner-2", tenant_id: "tenant-1" },
    ]);

    // 2. Checking properties_core: no properties linked
    mockSupabase.mockTableResult("properties_core", []);

    // 3. Deleting tenant_members_v3: mock success
    mockSupabase.mockSuccess([]);

    // 4. Deleting identities_v3: mock success with count 2
    mockSupabase.mockTableResult("identities_v3", [], 2);

    const result = await bulkDeleteOwnersAction(["owner-1", "owner-2"]);
    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);
    expect(result.message).toContain("ลบเจ้าของทรัพย์สำเร็จ 2 รายการ");
  });

  it("should skip owners that have associated properties", async () => {
    // 1. Fetching existing owners
    mockSupabase.mockTableResult("identities_v3", [
      { id: "owner-1", tenant_id: "tenant-1" },
      { id: "owner-2", tenant_id: "tenant-1" },
    ]);

    // 2. Checking properties_core: owner-2 has properties linked
    mockSupabase.mockTableResult("properties_core", [{ owner_id: "owner-2" }]);

    // 3. Deleting tenant_members_v3: mock success
    mockSupabase.mockSuccess([]);

    // 4. Deleting identities_v3: mock success with count 1 (only owner-1 is deleted)
    mockSupabase.mockTableResult("identities_v3", [], 1);

    const result = await bulkDeleteOwnersAction(["owner-1", "owner-2"]);
    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
    expect(result.message).toContain("ลบเจ้าของทรัพย์สำเร็จ 1 รายการ (ข้าม 1 รายการที่มีทรัพย์ผูกพันอยู่)");
  });

  it("should return failure if all selected owners have properties", async () => {
    // 1. Fetching existing owners
    mockSupabase.mockTableResult("identities_v3", [
      { id: "owner-1", tenant_id: "tenant-1" },
    ]);

    // 2. Checking properties_core: owner-1 has properties linked
    mockSupabase.mockTableResult("properties_core", [{ owner_id: "owner-1" }]);

    const result = await bulkDeleteOwnersAction(["owner-1"]);
    expect(result.success).toBe(false);
    expect(result.deletedCount).toBe(0);
    expect(result.message).toContain("ไม่สามารถลบเจ้าของที่เลือกได้");
  });

  it("should enforce tenant boundaries for non-admin staff", async () => {
    // Switch to AGENT role
    requireAuthContextMock.mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "u2" },
      role: "AGENT",
      tenantId: "tenant-1",
    });

    // Mock identities query to return only the owner belonging to tenant-1
    // (mocking the scenario where another owner belongs to tenant-2)
    mockSupabase.mockTableResult("identities_v3", [
      { id: "owner-1", tenant_id: "tenant-1" },
    ]);

    // Checking properties_core: no properties linked
    mockSupabase.mockTableResult("properties_core", []);

    // Deleting identities_v3: mock success with count 1
    mockSupabase.mockTableResult("identities_v3", [], 1);

    const result = await bulkDeleteOwnersAction(["owner-1", "owner-other-tenant"]);
    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
  });
});
