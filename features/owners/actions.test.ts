import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";
import { encrypt } from "@/lib/crypto";

describe("Owners Module - Actions", () => {
  let createOwnerAction: any;
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
      authzFail: vi.fn((err) => ({ success: false, message: err.message })),
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

    const actions = await import("./actions");
    createOwnerAction = actions.createOwnerAction;
  });

  it("should block creation if phone number already exists", async () => {
    // Mock the duplicate search query to return an existing owner with the same phone
    mockSupabase.mockTableResult("identities_v3", [
      {
        display_name: encrypt("Existing Owner"),
        phone: encrypt("0812345678"),
        line_id: encrypt("existing.line"),
      },
    ]);

    const result = await createOwnerAction({
      full_name: "New Owner",
      phone: "081-234-5678",
      line_id: "new.line",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("เบอร์โทรศัพท์นี้มีในระบบแล้ว");
    expect(result.message).toContain("Existing Owner");
  });

  it("should block creation if line_id already exists", async () => {
    // Mock the duplicate search query to return an existing owner with the same line_id
    mockSupabase.mockTableResult("identities_v3", [
      {
        display_name: encrypt("Existing Owner"),
        phone: encrypt("0899999999"),
        line_id: encrypt("duplicate.line"),
      },
    ]);

    const result = await createOwnerAction({
      full_name: "New Owner",
      phone: "0812345678",
      line_id: "duplicate.line",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Line ID นี้มีในระบบแล้ว");
    expect(result.message).toContain("Existing Owner");
  });

  it("should successfully create owner if phone and line_id are unique", async () => {
    // Mock the duplicate search query to return empty results (no duplicates)
    mockSupabase.mockTableResult("identities_v3", []);
    // Mock the insert response
    mockSupabase.mockTableResult("identities_v3", { id: "new-owner-id" });

    const result = await createOwnerAction({
      full_name: "New Owner",
      phone: "0812345678",
      line_id: "unique.line",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe("new-owner-id");
  });
});
