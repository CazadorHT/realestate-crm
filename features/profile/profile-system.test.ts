import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfileAction } from "./actions";
import { requireAuthContext } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";

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

describe("Profile & Identity Hardened System Test", () => {
  const mockUserId = "user-123";
  
  // Advanced Mock for Supabase Chain
  const mockSupabase: any = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  };

  const createMockChain = (resolveValue: any) => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled) => Promise.resolve(onFulfilled(resolveValue))),
    };
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("🚨 CRITICAL: Should sync phone and line_id to BOTH tables", async () => {
    const formData = new FormData();
    formData.append("full_name", "Hunter Hardened");
    formData.append("phone", "0812345678");
    formData.append("line_id", "hunter_v3");

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

    if (!result.success) {
      console.error("Test failed with message:", result.message);
    }

    expect(result.success).toBe(true);

    // Deep Inspection: Profiles update
    expect(profileChain.update).toHaveBeenCalledWith(expect.objectContaining({
      phone: "0812345678",
      line_id: "hunter_v3"
    }));

    // Deep Inspection: Identities sync (The Core Hardening)
    expect(identityChain.update).toHaveBeenCalledWith(expect.objectContaining({
      phone: "0812345678",
      line_id: "hunter_v3"
    }));
  });

  it("🛡️ SOCIAL: Should sync wechat_user_id and whatsapp_user_id to BOTH tables", async () => {
    const formData = new FormData();
    formData.append("full_name", "Hunter Social");
    formData.append("wechat_user_id", "wechat_123");
    formData.append("whatsapp_user_id", "whatsapp_456");

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

    // Verify Profiles update
    expect(profileChain.update).toHaveBeenCalledWith(expect.objectContaining({
      wechat_user_id: "wechat_123",
      whatsapp_user_id: "whatsapp_456"
    }));

    // Verify Identities sync (V3 Integrity)
    expect(identityChain.update).toHaveBeenCalledWith(expect.objectContaining({
      wechat_user_id: "wechat_123",
      whatsapp_user_id: "whatsapp_456"
    }));
  });

  it("🛡️ SECURITY: Should reject unauthorized profile update attempts", async () => {
    (requireAuthContext as any).mockRejectedValue(new Error("Unauthorized"));

    const formData = new FormData();
    formData.append("full_name", "Hacker");

    const result = await updateProfileAction(formData);

    expect(result.success).toBe(false);
    // ตรวจสอบข้อความ Error ภาษาไทยที่เราตั้งค่าไว้ใน lib/authz.ts
    expect(result.message).toMatch(/กรุณาเข้าสู่ระบบ|Unauthorized/);
  });

  it("🥊 VALIDATION: Should reject empty full_name", async () => {
    const formData = new FormData();
    formData.append("full_name", "   ");

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: mockUserId },
    });

    const result = await updateProfileAction(formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("กรุณากรอกชื่อ");
  });
});
