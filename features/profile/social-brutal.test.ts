import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfileAction } from "./actions";
import { requireAuthContext } from "@/lib/authz";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

describe("Profile Social Integration - BRUTAL TEST", () => {
  const mockUserId = "user-v3-elite";
  
  const mockSupabase: any = {
    from: vi.fn(),
  };

  const createMockChain = (resolveValue: any) => ({
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: vi.fn((onFulfilled) => Promise.resolve(onFulfilled(resolveValue))),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("🥊 BRUTAL 1: Should normalize whitespace-only strings to NULL", async () => {
    const formData = new FormData();
    formData.append("full_name", "Hardened User");
    formData.append("wechat_user_id", "   "); // Dirty whitespace
    formData.append("whatsapp_user_id", "");   // Empty string

    const profileChain = createMockChain({ error: null });
    const identityChain = createMockChain({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileChain;
      if (table === "identities_v3") return identityChain;
      return createMockChain({ error: null });
    });

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: mockUserId },
      role: "AGENT",
    });

    const result = await updateProfileAction(formData);
    expect(result.success).toBe(true);

    // Verify normalization to NULL in Profiles
    expect(profileChain.update).toHaveBeenCalledWith(expect.objectContaining({
      wechat_user_id: null,
      whatsapp_user_id: null
    }));

    // Verify normalization to NULL in Identity (Master)
    expect(identityChain.update).toHaveBeenCalledWith(expect.objectContaining({
      wechat_user_id: null,
      whatsapp_user_id: null
    }));
  });

  it("🥊 BRUTAL 2: Should trim messy IDs correctly", async () => {
    const formData = new FormData();
    formData.append("full_name", "Dirty Data User");
    formData.append("wechat_user_id", "  wechat_pro_99  ");
    formData.append("whatsapp_user_id", "  +66810000000  ");

    const profileChain = createMockChain({ error: null });
    const identityChain = createMockChain({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileChain;
      if (table === "identities_v3") return identityChain;
      return createMockChain({ error: null });
    });

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: mockUserId },
      role: "AGENT",
    });

    await updateProfileAction(formData);

    // Should be clean
    const expectedData = {
      wechat_user_id: "wechat_pro_99",
      whatsapp_user_id: "+66810000000"
    };

    expect(profileChain.update).toHaveBeenCalledWith(expect.objectContaining(expectedData));
    expect(identityChain.update).toHaveBeenCalledWith(expect.objectContaining(expectedData));
  });

  it("🥊 BRUTAL 3: Resilience - Should NOT fail if Identity sync fails", async () => {
    const formData = new FormData();
    formData.append("full_name", "Resilient User");
    formData.append("wechat_user_id", "resilient_id");

    const profileChain = createMockChain({ error: null });
    const identityChain = createMockChain({ error: { message: "Database is on fire", code: "500" } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileChain;
      if (table === "identities_v3") return identityChain;
      return createMockChain({ error: null });
    });

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: mockUserId },
      role: "AGENT",
    });

    const result = await updateProfileAction(formData);

    // Important: Action should still succeed because profile (main data) was saved
    expect(result.success).toBe(true);
    expect(profileChain.update).toHaveBeenCalled();
    expect(identityChain.update).toHaveBeenCalled();
  });
});
