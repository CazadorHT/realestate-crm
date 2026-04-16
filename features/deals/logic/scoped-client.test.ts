import { describe, it, expect, vi, beforeEach } from "vitest";
import { getScopedRevenueClient } from "./scoped-client";

describe("Scoped Revenue Client - Branch Isolation Verification", () => {
  let mockSupabase: any;
  const mockDocumentId = "doc-123";

  beforeEach(() => {
    vi.clearAllMocks();
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: mockUpdate,
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: mockDocumentId, file_name: 'test.pdf', storage_path: 's1' }, error: null }),
      }),
      rpc: vi.fn().mockReturnThis(),
    };
  });

  it("should automatically inject .eq('tenant_id', tenantId) for SELECT", () => {
    const tenantId = "tenant-123";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    
    scoped.from("deals").select("*");
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(mockSupabase.from).toHaveBeenCalledWith("deals");
    expect(dealsBuilder.eq).toHaveBeenCalledWith("tenant_id", tenantId);
  });

  it("should inject tenant_id into INSERT payload", () => {
    const tenantId = "tenant-123";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    const data = { title: "New Deal" };
    
    scoped.from("deals").insert(data);
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(dealsBuilder.insert).toHaveBeenCalledWith({
      title: "New Deal",
      tenant_id: tenantId,
    });
  });

  it("should inject tenant_id into array INSERT payload", () => {
    const tenantId = "tenant-123";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    const data = [{ title: "D1" }, { title: "D2" }];
    
    scoped.from("deals").insert(data);
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(dealsBuilder.insert).toHaveBeenCalledWith([
      { title: "D1", tenant_id: tenantId },
      { title: "D2", tenant_id: tenantId },
    ]);
  });

  it("should automatically inject .eq('tenant_id', tenantId) for DELETE", () => {
    const tenantId = "tenant-456";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    
    scoped.from("deal_commissions").delete();
    
    const commsBuilder = mockSupabase.from("deal_commissions");
    expect(mockSupabase.from).toHaveBeenCalledWith("deal_commissions");
    expect(commsBuilder.eq).toHaveBeenCalledWith("tenant_id", tenantId);
  });

  it("should inject p_tenant_id into RPC calls", () => {
    const tenantId = "tenant-789";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    
    scoped.rpc("sync_property_inventory_atomic", { p_property_id: "prop-1" });
    
    expect(mockSupabase.rpc).toHaveBeenCalledWith("sync_property_inventory_atomic", {
      p_property_id: "prop-1",
      p_tenant_id: tenantId,
    });
  });

  it("should NOT inject tenant_id if tenantId is 'ALL' (System Admin mode)", () => {
    const scoped = getScopedRevenueClient(mockSupabase as any, "ALL");
    
    scoped.from("deals").select("*");
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(dealsBuilder.eq).not.toHaveBeenCalled();
  });
});
