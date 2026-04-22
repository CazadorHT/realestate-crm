import { describe, it, expect, vi, beforeEach } from "vitest";
import { restorePropertyVersionAction } from "./restore";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";

// Mock the modules
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  authzFail: vi.fn((err) => ({ success: false, message: err.message, errorType: "UNAUTHORIZED" })),
  AuthzError: class AuthzError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message || code);
      this.code = code;
      this.name = 'AuthzError';
    }
  }
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("restorePropertyVersionAction", () => {
  let mockSupabase: any;
  const VALID_PROPERTY_ID = "550e8400-e29b-41d4-a716-446655440000";
  const VALID_LOG_ID = "550e8400-e29b-41d4-a716-446655440001";
  const mockUser = { id: "user-123" };
  const mockTenantId = "tenant-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis(),
    };
  });

  it("should successfully restore a property to a previous state", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: mockTenantId,
    });

    // Mock fetching audit log
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: VALID_LOG_ID,
        entity_id: VALID_PROPERTY_ID,
        tenant_id: mockTenantId,
        metadata: {
          old_state: { title: "Old Title", price: 5000000 }
        }
      },
      error: null
    });

    // Mock fetching current property version
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_PROPERTY_ID, version: 5, title: "Current Title" },
      error: null
    });

    // Mock RPC call
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { id: VALID_PROPERTY_ID, slug: "restored-property" },
      error: null
    });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(true);
    expect(result.message).toBe("คืนค่าข้อมูลสำเร็จ");
    expect(mockSupabase.rpc).toHaveBeenCalledWith("update_property_elite", expect.objectContaining({
      p_version: 5,
      p_data: expect.objectContaining({ title: "Old Title" })
    }));
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("should return error if log is not found", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: mockTenantId,
    });

    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("NOT_FOUND");
    expect(result.message).toContain("ไม่พบข้อมูลประวัติ");
  });

  it("should prevent cross-tenant restoration", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: "branch-A",
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_LOG_ID, tenant_id: "branch-B", metadata: {} },
      error: null
    });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("UNAUTHORIZED");
    expect(result.message).toContain("ไม่สามารถคืนค่าข้อมูลข้ามสาขา");
  });

  it("should handle version conflict (VC409) from RPC", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: mockTenantId,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_LOG_ID, tenant_id: mockTenantId, metadata: { old_state: { title: "Old" } } },
      error: null
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_PROPERTY_ID, version: 5 },
      error: null
    });

    // Mock RPC Failure with VC409
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "VC409: Version conflict" }
    });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("CONFLICT");
    expect(result.message).toContain("ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว");
  });

  it("should handle ownership errors (VC403) from RPC", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: mockTenantId,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_LOG_ID, tenant_id: mockTenantId, metadata: { old_state: { title: "Old" } } },
      error: null
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_PROPERTY_ID, version: 5 },
      error: null
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "VC403: Forbidden" }
    });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("UNAUTHORIZED");
    expect(result.message).toContain("คุณไม่มีสิทธิ์คืนค่าข้อมูลทรัพย์สินชิ้นนี้");
  });
});
