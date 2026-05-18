import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("System Module - Realtime Doctor (เทสโหดๆ แบบไม่อวย)", () => {
  let runRealtimeDiagnostic: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
    }));

    const doctor = await import("./realtime-doctor");
    runRealtimeDiagnostic = doctor.runRealtimeDiagnostic;
  });

  it("should return fully authenticated and OK status when system is healthy", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSupabase.mockTableResult("notifications", [{ id: "n1" }]);

    const result = await runRealtimeDiagnostic();
    expect(result.auth.status).toBe("AUTHENTICATED");
    expect(result.auth.userId).toBe("u1");
    expect(result.notifications_table.status).toBe("OK");
    expect(result.notifications_table.can_select).toBe(true);
  });

  it("should return ANONYMOUS when no user is logged in", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSupabase.mockTableResult("notifications", [{ id: "n1" }]);

    const result = await runRealtimeDiagnostic();
    expect(result.auth.status).toBe("ANONYMOUS");
    expect(result.auth.userId).toBeNull();
  });

  it("should return FAILED for notifications table if query returns error", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSupabase.mockTableError("notifications", new Error("RLS_VIOLATION"));

    const result = await runRealtimeDiagnostic();
    expect(result.notifications_table.status).toBe("FAILED");
    expect(result.notifications_table.error).toContain("RLS_VIOLATION");
    expect(result.notifications_table.can_select).toBe(false);
  });

  it("should handle exceptions and return CRASHED/ERROR statuses", async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error("AUTH_CRASH"));
    mockSupabase.from.mockImplementationOnce(() => {
      throw new Error("TABLE_CRASH");
    });

    const result = await runRealtimeDiagnostic();
    expect(result.auth.status).toBe("ERROR");
    expect(result.notifications_table.status).toBe("CRASHED");
  });
});
