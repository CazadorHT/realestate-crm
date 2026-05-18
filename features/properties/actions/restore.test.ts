import { describe, it, expect, vi, beforeEach } from "vitest";
import { restorePropertyVersionAction } from "./restore";
import { requireAuthContext } from "@/lib/authz";

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

vi.mock("./update", () => ({
  updatePropertyAction: vi.fn(),
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
    };
  });

  it("should successfully restore a property to a previous state", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: mockTenantId,
    });

    const { updatePropertyAction } = await import("./update");
    (updatePropertyAction as any).mockResolvedValue({ success: true });

    // Mock fetching audit log
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: VALID_LOG_ID,
        entity_id: VALID_PROPERTY_ID,
        tenant_id: mockTenantId,
        new_data: { title: "Old Title", price: 5000000, slug: "old-slug" }
      },
      error: null
    });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(true);
    expect(result.message).toBe("คืนค่าข้อมูลสำเร็จ");
    expect(updatePropertyAction).toHaveBeenCalledWith(
        VALID_PROPERTY_ID, 
        expect.objectContaining({ title: "Old Title" }), 
        expect.stringContaining("RESTORE")
    );
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
  });

  it("should prevent cross-tenant restoration", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser,
      role: "AGENT",
      tenantId: "branch-A",
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: VALID_LOG_ID, tenant_id: "branch-B", new_data: {} },
      error: null
    });

    const result = await restorePropertyVersionAction(VALID_PROPERTY_ID, VALID_LOG_ID);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("UNAUTHORIZED");
  });
});
