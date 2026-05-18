import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Calendar Module - Actions (เทสโหดๆ แบบไม่อวย)", () => {
  let createAppointment: any;
  let updateEventDate: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/authz", () => ({
      requireAuthContext: vi.fn().mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        role: "AGENT",
        tenantId: "tenant-1",
      }),
    }));

    vi.doMock("@/lib/actions/system-config", () => ({
      getSystemConfig: vi.fn().mockResolvedValue({
        multi_tenant_enabled: true,
        default_tenant_id: "tenant-1",
      }),
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    const actions = await import("./actions");
    createAppointment = actions.createAppointment;
    updateEventDate = actions.updateEventDate;
  });

  describe("createAppointment", () => {
    it("should successfully create appointment for matching tenant lead", async () => {
      mockSupabase
        .mockTableResult("crm_leads_v3", { tenant_id: "tenant-1" })
        .mockTableResult("activity_timeline_v3", { success: true });

      const formData = new FormData();
      formData.append("leadId", "lead-1");
      formData.append("propertyId", "prop-1");
      formData.append("date", "2026-06-01");
      formData.append("time", "14:00");
      formData.append("note", "Viewing meeting");
      formData.append("activityType", "VIEWING");

      await expect(createAppointment(formData)).resolves.toBeUndefined();
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          target_entity: "LEAD",
          target_id: "lead-1",
          activity_type: "VIEWING",
        })
      );
    });

    it("should reject appointment if lead belongs to a different tenant", async () => {
      mockSupabase.mockTableResult("crm_leads_v3", { tenant_id: "tenant-DIFFERENT" });

      const formData = new FormData();
      formData.append("leadId", "lead-1");
      formData.append("propertyId", "prop-1");
      formData.append("date", "2026-06-01");
      formData.append("time", "14:00");

      await expect(createAppointment(formData)).rejects.toThrow("Unauthorized");
    });

    it("should throw error if required fields are missing", async () => {
      const formData = new FormData();
      formData.append("leadId", ""); // Missing leadId

      await expect(createAppointment(formData)).rejects.toThrow("Missing required fields");
    });
  });

  describe("updateEventDate", () => {
    it("should update activity timeline date for viewing type", async () => {
      mockSupabase.mockTableResult("activity_timeline_v3", { success: true });

      const result = await updateEventDate("act-1", "2026-06-02T15:00:00Z", "viewing");
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ created_at: "2026-06-02T15:00:00Z" });
    });

    it("should update deal transaction date for deal_closing type", async () => {
      mockSupabase.mockTableResult("crm_deals_v3", { success: true });

      const result = await updateEventDate("deal-1", "2026-06-05T10:00:00Z", "deal_closing");
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ transaction_date: "2026-06-05T10:00:00Z" });
    });

    it("should handle early_termination and preserve existing metadata", async () => {
      mockSupabase
        .mockTableResult("crm_deals_v3", { metadata: { initial_notes: "Test" } }) // select
        .mockTableResult("crm_deals_v3", { success: true }); // update

      const result = await updateEventDate("deal-1-terminated", "2026-06-10T12:00:00Z", "early_termination");
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { initial_notes: "Test", check_out_date: "2026-06-10T12:00:00Z" },
        })
      );
    });

    it("should throw error if update fails", async () => {
      mockSupabase.mockTableError("activity_timeline_v3", new Error("UPDATE_FAILED"));

      await expect(updateEventDate("act-1", "2026-06-02T15:00:00Z", "viewing")).rejects.toThrow("ไม่สามารถอัปเดตวันนัดหมายได้");
    });
  });
});
