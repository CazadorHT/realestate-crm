import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Global Search Module - Actions (เทสโหดๆ แบบไม่อวย)", () => {
  let searchGlobalAction: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/authz", () => ({
      requireAuthContext: vi.fn().mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        role: "ADMIN",
        tenantId: "tenant-1",
      }),
      assertStaff: vi.fn(),
    }));

    const actions = await import("./actions");
    searchGlobalAction = actions.searchGlobalAction;
  });

  it("should return empty array if query is too short", async () => {
    const results = await searchGlobalAction("a");
    expect(results).toEqual([]);
  });

  it("should search across properties, leads, owners, and agents successfully", async () => {
    mockSupabase
      .mockTableResult("properties", [{ id: "p1", title: "Condo A", district: "Asoke" }])
      .mockTableResult("leads", [{ id: "l1", full_name: "John Doe", phone: "0812345678" }])
      .mockTableResult("owners", [{ id: "o1", full_name: "Jane Smith", phone: "0898765432" }])
      .mockTableResult("profiles", [{ id: "a1", full_name: "Agent Bob", role: "AGENT", phone: "0855555555" }]);

    const results = await searchGlobalAction("Condo");
    expect(results).toHaveLength(4);

    expect(results[0]).toEqual({
      id: "p1",
      type: "property",
      title: "Condo A",
      subtitle: "Asoke",
      url: "/protected/properties/p1",
    });

    expect(results[1]).toEqual({
      id: "l1",
      type: "lead",
      title: "John Doe",
      subtitle: "0812345678",
      url: "/protected/leads/l1",
    });

    expect(results[2]).toEqual({
      id: "o1",
      type: "owner",
      title: "Jane Smith",
      subtitle: "0898765432",
      url: "/protected/owners/o1",
    });

    expect(results[3]).toEqual({
      id: "a1",
      type: "agent",
      title: "Agent Bob",
      subtitle: "Agent • 0855555555",
      url: "/protected/settings/users",
    });
  });

  it("should handle database search errors gracefully and return partial or empty results", async () => {
    mockSupabase
      .mockTableError("properties", new Error("DB_SEARCH_ERROR"))
      .mockTableResult("leads", [])
      .mockTableResult("owners", [])
      .mockTableResult("profiles", []);

    const results = await searchGlobalAction("Condo");
    expect(results).toEqual([]);
  });
});
