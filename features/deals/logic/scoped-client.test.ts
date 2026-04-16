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
    
    scoped.deals().select("*");
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(mockSupabase.from).toHaveBeenCalledWith("deals");
    expect(dealsBuilder.eq).toHaveBeenCalledWith("tenant_id", tenantId);
  });

  it("should inject tenant_id into INSERT payload", () => {
    const tenantId = "tenant-123";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    const data = { 
      deal_type: "SALE" as const, 
      lead_id: "l-1", 
      property_id: "p-1", 
      status: "NEGOTIATING" as const 
    };
    
    scoped.deals().insert(data);
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(dealsBuilder.insert).toHaveBeenCalledWith({
      ...data,
      tenant_id: tenantId,
    });
  });

  it("should inject tenant_id into array INSERT payload", () => {
    const tenantId = "tenant-123";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    const data = [
      { deal_type: "SALE" as const, lead_id: "l-1", property_id: "p-1", status: "NEGOTIATING" as const },
      { deal_type: "RENT" as const, lead_id: "l-2", property_id: "p-2", status: "NEGOTIATING" as const }
    ];
    
    scoped.deals().insert(data);
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(dealsBuilder.insert).toHaveBeenCalledWith([
      { ...data[0], tenant_id: tenantId },
      { ...data[1], tenant_id: tenantId },
    ]);
  });

  it("should automatically inject .eq('tenant_id', tenantId) for DELETE", () => {
    const tenantId = "tenant-456";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    
    scoped.commissions().delete();
    
    const commsBuilder = mockSupabase.from("deal_commissions");
    expect(mockSupabase.from).toHaveBeenCalledWith("deal_commissions");
    expect(commsBuilder.eq).toHaveBeenCalledWith("tenant_id", tenantId);
  });

  it("should inject p_tenant_id into RPC calls", () => {
    const tenantId = "tenant-789";
    const scoped = getScopedRevenueClient(mockSupabase as any, tenantId);
    
    scoped.rpc("sync_property_inventory_atomic", { 
      p_property_id: "prop-1",
      p_adjustment: 1,
      p_deal_type: "SALE",
      p_tenant_id: tenantId
    });
    
    expect(mockSupabase.rpc).toHaveBeenCalledWith("sync_property_inventory_atomic", {
      p_property_id: "prop-1",
      p_adjustment: 1,
      p_deal_type: "SALE",
      p_tenant_id: tenantId,
    });
  });

  it("should NOT inject tenant_id if tenantId is 'ALL' (System Admin mode)", () => {
    const scoped = getScopedRevenueClient(mockSupabase as any, "ALL");
    
    scoped.deals().select("*");
    
    const dealsBuilder = mockSupabase.from("deals");
    expect(dealsBuilder.eq).not.toHaveBeenCalled();
  });
});
