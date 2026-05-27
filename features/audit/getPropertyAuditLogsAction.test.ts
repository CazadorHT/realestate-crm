import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPropertyAuditLogsAction } from "./actions";
import { requireAuthContext } from "@/lib/authz";

// Mock the auth layer
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
}));

describe("getPropertyAuditLogsAction - Branch Isolation & Data Fetching", () => {
  let mockSupabase: any;
  const PROPERTY_ID = "prop-123";
  const TENANT_ID = "branch-a";

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a chainable mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };
  });

  it("should enforce Branch Isolation for non-admin views", async () => {
    // Setup Auth Context for a specific branch
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: TENANT_ID,
      user: { id: "user-1" },
    });

    // Mock returning some data
    mockSupabase.range.mockResolvedValue({
      data: [{ id: "log-1", action: "property.update", tenant_id: TENANT_ID }],
      error: null,
      count: 1,
    });

    const result = await getPropertyAuditLogsAction(PROPERTY_ID, 1, 10);

    expect(result.success).toBe(true);
    expect(result.data?.logs).toHaveLength(1);
    
    // Verify tenant_id filter is applied
    const eqCalls = mockSupabase.eq.mock.calls;
    expect(eqCalls).toContainEqual(["tenant_id", TENANT_ID]);
    expect(eqCalls).toContainEqual(["entity_id", PROPERTY_ID]);
  });

  it("should allow cross-branch view when tenantId is 'ALL'", async () => {
    // Setup Auth Context for "ALL" branches (Super Admin mode)
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: "ALL",
      user: { id: "admin-1" },
    });

    mockSupabase.range.mockResolvedValue({
      data: [{ id: "log-1", tenant_id: "branch-b" }],
      error: null,
      count: 1,
    });

    const result = await getPropertyAuditLogsAction(PROPERTY_ID, 1, 10);

    expect(result.success).toBe(true);
    // Verify tenant_id filter is NOT applied
    const eqCalls = mockSupabase.eq.mock.calls;
    const hasTenantFilter = eqCalls.some((call: any) => call[0] === "tenant_id");
    expect(hasTenantFilter).toBe(false);
  });

  it("should calculate pagination range correctly for page 2", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: TENANT_ID,
      user: { id: "user-1" },
    });

    mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 25 });

    const PAGE_SIZE = 10;
    await getPropertyAuditLogsAction(PROPERTY_ID, 2, PAGE_SIZE);

    // Page 2 start at (2-1)*10 = 10, end at 10 + 10 - 1 = 19
    expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
  });

  it("should return false and message on Supabase failure", async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: TENANT_ID,
    });

    mockSupabase.range.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    const result = await getPropertyAuditLogsAction(PROPERTY_ID);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Database connection failed");
    expect(result.errorType).toBe("SYSTEM_ERROR");
  });
});
