import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findExistingLeadAction,
  searchProjectsForQuickDocAction,
  createQuickDocumentAction,
} from "./quick-document-actions";
import { requireAuthContext } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDealAction } from "@/features/deals/actions";
import { generateDocumentFromTemplateAction } from "./generation-actions";

// 1. Mock Auth
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  resolveTenantId: vi.fn().mockImplementation((_, __, tenantId) => Promise.resolve(tenantId || "mock-tenant-id")),
}));

// 2. Mock Supabase Admin
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// 3. Mock Next.js Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// 4. Mock Deals and Generation Actions
vi.mock("@/features/deals/actions", () => ({
  createDealAction: vi.fn(),
}));

vi.mock("./generation-actions", () => ({
  generateDocumentFromTemplateAction: vi.fn(),
}));

// 5. Mock Project Suggestions
vi.mock("@/features/properties/actions/project-suggestions", () => ({
  getProjectSuggestions: vi.fn().mockResolvedValue([
    {
      id: "proj-1",
      name: { th: "ศุภาลัย เวอแรนด้า", en: "Supalai Veranda" },
      address_line1: "Supalai Veranda",
      slug: "supalai-veranda",
    },
  ]),
}));

describe("Quick Document Generation Actions", () => {
  const mockUser = { id: "user-123" };
  const mockTenantId = "tenant-test";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findExistingLeadAction", () => {
    it("should return empty leads array if query length < 3", async () => {
      const res = await findExistingLeadAction("08");
      expect(res.success).toBe(true);
      expect(res.leads).toEqual([]);
    });

    it("should return matching leads when query matches phone or name", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: "lead-1",
                utm_data: { preferences: { nationality: "Thai" } },
                identities_v3: {
                  id: "id-1",
                  display_name: "John Doe", // plain or mock
                  phone: "0812345678",
                  email: "john@example.com",
                  line_id: "johnline",
                },
              },
            ],
            error: null,
          }),
        }),
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        tenantId: mockTenantId,
      });

      const res = await findExistingLeadAction("0812345678");
      expect(res.success).toBe(true);
      expect(res.leads.length).toBeGreaterThanOrEqual(1);
      expect(res.leads[0].full_name).toBe("John Doe");
    });
  });

  describe("searchProjectsForQuickDocAction", () => {
    it("should return project suggestions list", async () => {
      const res = await searchProjectsForQuickDocAction("Supalai");
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe("proj-1");
    });
  });

  describe("createQuickDocumentAction (End-to-End Orchestration)", () => {
    it("should validate and fail gracefully if required fields are missing", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: {},
        user: mockUser,
        tenantId: mockTenantId,
      });

      const invalidPayload = {} as any;
      const res = await createQuickDocumentAction(invalidPayload);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("should orchestrate Lead, Property, Deal and Document generation successfully", async () => {
      const mockInsertIdentity = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "new-identity-id" }, error: null }),
        }),
      });

      const mockInsertLead = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "new-lead-id" }, error: null }),
        }),
      });

      const mockInsertCore = vi.fn().mockResolvedValue({ error: null });
      const mockInsertDetails = vi.fn().mockResolvedValue({ error: null });

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "identities_v3") return { insert: mockInsertIdentity };
          if (table === "crm_leads_v3") return { insert: mockInsertLead };
          if (table === "properties_core") return { insert: mockInsertCore };
          if (table === "properties_details") return { insert: mockInsertDetails };
          if (table === "crm_deals_v3") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };

      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        tenantId: mockTenantId,
      });

      (createAdminClient as any).mockReturnValue(mockAdmin);

      (createDealAction as any).mockResolvedValue({
        success: true,
        data: { id: "deal-12345" },
      });

      (generateDocumentFromTemplateAction as any).mockResolvedValue({
        success: true,
        data: { id: "doc-999", title: "Reservation Form", storage_path: "docs/deal-12345/res.html" },
      });

      const validPayload = {
        template_id: "00000000-0000-0000-0000-000000000001",
        language: "th" as const,
        client: {
          full_name: "Marianne Ignacio",
          phone: "081-999-8888",
          nationality: "PHL",
        },
        property: {
          project_name: "Supalai Veranda Ramkhamhaeng",
          unit_number: "22/22",
          floor: "11",
          bedrooms: 1,
          bathrooms: 1,
          rental_price: 10000,
          listing_type: "RENT" as const,
        },
        financials: {
          items: [
            { description: "Reservation Fee", quantity: 1, unit_price: 10000, total: 10000 },
          ],
        },
        payment: {
          bank_name: "Krung Thai Bank",
          bank_account_no: "208-2-76313-1",
          account_name: "VC Connect Asset",
          payment_method: "Transfer",
        },
      };

      const result = await createQuickDocumentAction(validPayload);

      expect(result.success).toBe(true);
      expect(result.dealId).toBe("deal-12345");
      expect(result.leadId).toBe("new-lead-id");
      expect(result.propertyId).toBeDefined();
      expect(result.documentId).toBe("doc-999");
      expect(result.storagePath).toBe("docs/deal-12345/res.html");

      // Verify that createDealAction was called with correct parameters
      expect(createDealAction).toHaveBeenCalledWith(
        expect.objectContaining({
          lead_id: "new-lead-id",
          deal_type: "RENT",
          status: "NEGOTIATING",
          source: "QUICK_DOCUMENT",
        }),
      );

      // Verify generateDocumentFromTemplateAction was called with DEAL owner type and deal ID
      expect(generateDocumentFromTemplateAction).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000001",
        "deal-12345",
        "DEAL",
        expect.objectContaining({
          bank_name: "Krung Thai Bank",
          bank_account_no: "208-2-76313-1",
          client_name_override: "Marianne Ignacio",
        }),
      );
    });
  });
});

