import { describe, it, expect, vi, beforeEach } from "vitest";
import { convertLeadToOwnerAction } from "./convert-lead-to-owner-action";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "th" }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
}));

vi.mock("@/lib/actions/system-config", () => ({
  getSystemConfig: vi.fn().mockResolvedValue({ multi_tenant_enabled: false }),
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/crypto", () => ({
  encrypt: vi.fn((val) => (val ? `enc:${val}` : val)),
  decrypt: vi.fn((val) => (val && typeof val === "string" && val.startsWith("enc:") ? val.replace("enc:", "") : val)),
}));

import { requireAuthContext } from "@/lib/authz";

describe("convertLeadToOwnerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should convert lead to owner and parse deposit details", async () => {
    const mockLead = {
      id: "lead-123",
      tenant_id: null,
      utm_data: {
        property_type: "CONDO",
        note_encrypted: "enc:[ฝากทรัพย์]\nอีเมล: test@test.com\nLine: line123\nType: CONDO\nImage: https://example.com/img.jpg\nDetails: คอนโดใจกลางเมือง ชั้น 20",
      },
      identity: {
        id: "id-123",
        display_name: "enc:Somchai",
        phone: "enc:0812345678",
        line_id: "enc:line123",
        social_links: { email: "enc:test@test.com" },
      },
    };

    const mockInsertTimeline = vi.fn().mockResolvedValue({ error: null });
    const mockInsertOwner = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "owner-new-1" }, error: null }),
      }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "crm_leads_v3") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "identities_v3") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
            insert: mockInsertOwner,
          };
        }
        if (table === "activity_timeline_v3") {
          return {
            insert: mockInsertTimeline,
          };
        }
        return {};
      }),
    };

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "staff-1" },
      userId: "staff-1",
      role: "STAFF",
      tenantId: null,
    });

    const result = await convertLeadToOwnerAction("lead-123");

    expect(result.success).toBe(true);
    expect(result.ownerId).toBe("owner-new-1");
    expect(result.leadData?.ownerName).toBe("Somchai");
    expect(result.leadData?.phone).toBe("0812345678");
    expect(result.leadData?.propertyType).toBe("CONDO");
    expect(result.leadData?.imageUrl).toBe("https://example.com/img.jpg");
    expect(result.leadData?.details).toBe("คอนโดใจกลางเมือง ชั้น 20");
    expect(mockInsertTimeline).toHaveBeenCalled();
  });

  it("should bulk convert leads to owners", async () => {
    const mockLead = {
      id: "lead-1",
      tenant_id: null,
      utm_data: {},
      identity: {
        id: "id-1",
        display_name: "enc:Somchai",
        phone: "enc:0812345678",
      },
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "crm_leads_v3") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "identities_v3") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "owner-1" }, error: null }),
              }),
            }),
          };
        }
        if (table === "activity_timeline_v3") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      }),
    };

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "staff-1" },
      userId: "staff-1",
      role: "STAFF",
      tenantId: null,
    });

    const { bulkConvertLeadsToOwnersAction } = await import("./convert-lead-to-owner-action");
    const result = await bulkConvertLeadsToOwnersAction(["lead-1"]);

    expect(result.success).toBe(true);
    expect(result.convertedCount).toBe(1);
  });
});
