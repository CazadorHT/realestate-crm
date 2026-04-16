import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePropertyAction, updatePropertyStatusAction } from "./update";
import { requireAuthContext, isAdmin } from "@/lib/authz";

// Mock the modules
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertAuthenticated: vi.fn(),
  assertStaff: vi.fn(),
  authzFail: vi.fn((err) => ({ success: false, message: err.message })),
  isAdmin: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../logic/seo", () => ({
  generateKeywords: vi.fn(() => []),
  prepareSEOData: vi.fn(() => ({ slug: "test-slug", metaTitle: "Title", metaDescription: "Desc", metaKeywords: [], structuredData: {} })),
}));

vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: vi.fn() },
}));

vi.mock("../logic/notifications", () => ({
  sendStatusUpdateNotification: vi.fn(),
  sendPriceDropNotification: vi.fn(),
}));

vi.mock("../image-utils", () => ({
  getPublicImageUrl: vi.fn((path) => `https://test.com/${path}`),
}));

describe("Property Update Actions - Elite Hardening", () => {
  let mockSupabase: any;

  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
  const mockUser = { id: "user-123", email: "test@example.com" };
  const mockTenantId = "tenant-1";

  /** Helper to generate valid property data based on FormSchema */
  const getValidPropertyData = (overrides = {}): any => {
    const data = {
      title: "Test Property",
      property_type: "CONDO",
      listing_type: "SALE",
      original_price: 1000000,
      commission_sale_percentage: 3,
      address_line1: "123 Test St",
      province: "Bangkok",
      district: "Watthana",
      subdistrict: "Khlong Toei Nuea",
      google_maps_link: "https://maps.google.com/test",
      version: 1,
      ...overrides,
    };
    return data;
  };

  const getFullExistingData = (overrides = {}) => ({
    id: VALID_UUID,
    tenant_id: mockTenantId,
    created_by: mockUser.id,
    status: "DRAFT",
    requires_ai_review: true,
    title: "Test Property",
    description: undefined,
    price: undefined,
    rental_price: undefined,
    original_price: 1000000,
    original_rental_price: undefined,
    listing_type: "SALE",
    property_type: "CONDO",
    address_line1: "123 Test St",
    district: "Watthana",
    province: "Bangkok",
    subdistrict: "Khlong Toei Nuea",
    bedrooms: 2,
    bathrooms: undefined,
    size_sqm: undefined,
    land_size_sqwah: undefined,
    property_agents: [],
    property_features: [],
    google_maps_link: "https://maps.google.com/test",
    version: 1,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (isAdmin as any).mockReturnValue(false);

    // Create a fresh mock supabase for each test
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      storage: {
        from: vi.fn().mockReturnThis(),
        remove: vi.fn().mockResolvedValue({ error: null }),
      },
    };
  });

  describe("updatePropertyAction", () => {
    it("should prevent cross-tenant data leakage (Branch Isolation)", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "AGENT",
        tenantId: "branch-A",
      });

      mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

      const result = await updatePropertyAction(VALID_UUID, getValidPropertyData(), "session-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Property not found");
      expect(mockSupabase.from).toHaveBeenCalledWith("properties");
    });

    it("should prevent agents from updating properties they don't own (Ownership Guard)", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "AGENT",
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: VALID_UUID, tenant_id: mockTenantId, created_by: "other-user", version: 1 },
        error: null,
      });

      const result = await updatePropertyAction(VALID_UUID, getValidPropertyData({ title: "New Title" }), "session-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Forbidden: You can only update your own properties");
    });

    it("should allow Admins to update any property in their branch via RPC", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "ADMIN",
        tenantId: mockTenantId,
      });
      (isAdmin as any).mockReturnValue(true);

      mockSupabase.single.mockResolvedValue({
        data: { 
          id: VALID_UUID, tenant_id: mockTenantId, created_by: "other-user", version: 1,
          status: "ACTIVE", title: "Old Title", listing_type: "SALE",
          property_agents: [], property_features: []
        },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID, slug: "test-slug" }, error: null });

      const result = await updatePropertyAction(VALID_UUID, getValidPropertyData({ title: "Admin Update" }), "session-1");

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("update_property_elite", expect.objectContaining({
        p_id: VALID_UUID,
        p_is_admin: true
      }));
    });

    it("should allow Managers to update any property in their branch", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "MANAGER",
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { 
          id: VALID_UUID, tenant_id: mockTenantId, created_by: "other-user", version: 1,
          status: "ACTIVE", title: "Old Title", listing_type: "SALE",
          property_agents: [], property_features: []
        },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID, slug: "test-slug" }, error: null });

      const result = await updatePropertyAction(VALID_UUID, getValidPropertyData({ title: "Manager Update" }), "session-1");

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("update_property_elite", expect.objectContaining({
        p_is_admin: true
      }));
    });

    it("should enforce DRAFT status when AI review is requested (AI Safeguard)", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "AGENT",
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { 
          id: VALID_UUID, tenant_id: mockTenantId, created_by: mockUser.id, status: "ACTIVE", version: 1,
          listing_type: "SALE", property_agents: [], property_features: []
        },
        error: null,
      });
      
      mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID }, error: null });

      const values = getValidPropertyData({
        status: "ACTIVE",
        requires_ai_review: true,
      });

      await updatePropertyAction(VALID_UUID, values, "session-1");

      const rpcCall = mockSupabase.rpc.mock.calls.find((call: any) => call[0] === "update_property_elite");
      expect(rpcCall[1].p_data.status).toBe("DRAFT");
    });

    it("should calculate and log semantic diff in audit log", async () => {
      const { logAudit } = await import("@/lib/audit");
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "AGENT",
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { 
          id: VALID_UUID, tenant_id: mockTenantId, created_by: mockUser.id, status: "ACTIVE", version: 1,
          title: "Old Title", price: 1000000, listing_type: "SALE",
          property_agents: [], property_features: []
        },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID, slug: "test-slug" }, error: null });

      await updatePropertyAction(VALID_UUID, getValidPropertyData({ title: "New Title", price: 900000 }), "session-1");

      expect(logAudit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            diff: expect.arrayContaining([
              expect.stringContaining("ชื่อทรัพย์: Old Title → New Title"),
              expect.stringContaining("ราคาขายปัจจุบัน: ฿1.0M → ฿900k")
            ])
          })
        })
      );
    });

    it("should localize Enum values (status, types) into Thai in audit log", async () => {
      const { logAudit } = await import("@/lib/audit");
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "AGENT",
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { 
          id: VALID_UUID, tenant_id: mockTenantId, created_by: mockUser.id,
          status: "DRAFT", listing_type: "RENT", property_type: "CONDO",
          property_agents: [], property_features: []
        },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID, slug: "test-slug" }, error: null });

      await updatePropertyAction(VALID_UUID, getValidPropertyData({ 
        status: "ACTIVE", 
        listing_type: "SALE" 
      }), "session-1");

      expect(logAudit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            diff: expect.arrayContaining([
              expect.stringContaining("สถานะ: ร่าง → ใช้งาน"),
              expect.stringContaining("ประเภทประกาศ: เช่า → ขาย")
            ])
          })
        })
      );
    });

    describe('Sentinel Auto-Clear Edge Cases', () => {
      it('should clear AI review flag if a minor field (like bedrooms) is changed by staff', async () => {
        (requireAuthContext as any).mockResolvedValue({
          supabase: mockSupabase,
          user: mockUser,
          role: "ADMIN",
          tenantId: mockTenantId,
        });
        (isAdmin as any).mockReturnValue(true);

        // Existing: 2 bedrooms, requires_ai_review: true
        mockSupabase.single.mockResolvedValue({
          data: getFullExistingData({ bedrooms: 2 }),
          error: null,
        });

        mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID }, error: null });

        // Update to 3 bedrooms
        const values = getValidPropertyData({ bedrooms: 3, version: 1 });
        await updatePropertyAction(VALID_UUID, values, "session-1");

        const rpcCall = mockSupabase.rpc.mock.calls.find((call: any) => call[0] === "update_property_elite");
        expect(rpcCall[1].p_data.requires_ai_review).toBe(false);
        expect(rpcCall[1].p_data.ai_reviewed_at).toBeDefined();
        expect(rpcCall[1].p_data.ai_reviewed_by).toBe(mockUser.id);
      });

      it('should NOT clear AI review flag if no significant fields have changed', async () => {
        (requireAuthContext as any).mockResolvedValue({
          supabase: mockSupabase,
          user: mockUser,
          role: "ADMIN",
          tenantId: mockTenantId,
        });
        (isAdmin as any).mockReturnValue(true);

        mockSupabase.single.mockResolvedValue({
          data: getFullExistingData(),
          error: null,
        });

        mockSupabase.rpc.mockResolvedValue({ data: { id: VALID_UUID }, error: null });

        // Update with same values, preserving the review flag
        const values = getValidPropertyData({ 
          bedrooms: 2, 
          version: 1,
          requires_ai_review: true 
        });
        await updatePropertyAction(VALID_UUID, values, "session-1");

        const rpcCall = mockSupabase.rpc.mock.calls.find((call: any) => call[0] === "update_property_elite");
        expect(rpcCall[1].p_data.requires_ai_review).toBe(true);
      });
    });
  });

  describe("updatePropertyStatusAction", () => {
    it("should block status change if AI review is pending", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: "AGENT",
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: VALID_UUID, requires_ai_review: true, status: "DRAFT", version: 1 },
        error: null,
      });

      mockSupabase.select.mockReturnValueOnce(mockSupabase);

      const result = await updatePropertyStatusAction({ id: VALID_UUID, status: "ACTIVE" });

      expect(result.success).toBe(false);
      expect(result.message).toContain("กรุณาตรวจสอบข้อมูล AI");
    });
  });
});
