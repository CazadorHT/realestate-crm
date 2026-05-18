import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTenantsAction } from "./tenant-management";

// Mock the auth context
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertAdmin: vi.fn(),
}));

describe("Tenant Management Secure Actions (Phase 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use the authenticated supabase client from context (Zero-Admin)", async () => {
    const { requireAuthContext, assertAdmin } = await import("@/lib/authz");
    
    // Mocking the context with a regular supabase client (NOT admin)
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    (requireAuthContext as any).mockResolvedValue({
      user: { id: "user-1" },
      role: "ADMIN",
      supabase: mockSupabase,
    });

    // Run the action
    await getTenantsAction();

    // Verify assertAdmin was called to ensure security
    expect(assertAdmin).toHaveBeenCalledWith("ADMIN");
    
    // Verify that the action used the supabase client from the context
    // and NOT createAdminClient()
    expect(mockSupabase.from).toHaveBeenCalledWith("tenants_v3");
  });
});
