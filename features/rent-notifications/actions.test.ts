import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Rent Notifications Module - Actions & Queries (เทสโหดๆ แบบไม่อวย)", () => {
  let createRentNotificationRule: any;
  let updateRentNotificationRule: any;
  let deleteRentNotificationRule: any;
  let toggleRentNotificationRule: any;
  let deleteRentNotificationRules: any;
  let toggleRentNotificationRules: any;
  let testSendRentNotification: any;
  let getRentNotificationRules: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    // Mock fetch for LINE API
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(""),
    });

    process.env.LINE_CHANNEL_ACCESS_TOKEN = "MOCK_TOKEN";

    const actions = await import("./actions");
    const queries = await import("./queries.server");

    createRentNotificationRule = actions.createRentNotificationRule;
    updateRentNotificationRule = actions.updateRentNotificationRule;
    deleteRentNotificationRule = actions.deleteRentNotificationRule;
    toggleRentNotificationRule = actions.toggleRentNotificationRule;
    deleteRentNotificationRules = actions.deleteRentNotificationRules;
    toggleRentNotificationRules = actions.toggleRentNotificationRules;
    testSendRentNotification = actions.testSendRentNotification;
    getRentNotificationRules = queries.getRentNotificationRules;
  });

  describe("createRentNotificationRule", () => {
    it("should successfully create rent notification rule", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", { success: true });

      const input = {
        property_id: "123e4567-e89b-12d3-a456-426614174000",
        line_group_id: "group-1",
        notification_day: 25,
        notification_hour: 9,
        language: "th" as const,
        tenant_id: "123e4567-e89b-12d3-a456-426614174001",
        is_active: true,
      };

      const result = await createRentNotificationRule(input);
      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should reject invalid rule data via Zod schema", async () => {
      const input = {
        property_id: "invalid-uuid", // Invalid property_id
        line_group_id: "group-1",
        notification_day: 35, // Out of bounds day
        notification_hour: 9,
        language: "th" as const,
        tenant_id: "invalid-uuid",
      };

      const result = await createRentNotificationRule(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain("เกิดข้อผิดพลาด");
    });
  });

  describe("updateRentNotificationRule & toggle", () => {
    it("should successfully update rule", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", { success: true });

      const result = await updateRentNotificationRule("rule-1", { notification_hour: 10 }, "tenant-1");
      expect(result.success).toBe(true);
    });

    it("should successfully toggle rule active state", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", { success: true });

      const result = await toggleRentNotificationRule("rule-1", false, "tenant-1");
      expect(result.success).toBe(true);
    });
  });

  describe("deleteRentNotificationRule & bulk delete/toggle", () => {
    it("should successfully delete single rule", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", { success: true });

      const result = await deleteRentNotificationRule("rule-1", "tenant-1");
      expect(result.success).toBe(true);
    });

    it("should successfully bulk delete rules", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", { success: true });

      const result = await deleteRentNotificationRules(["rule-1", "rule-2"], "tenant-1");
      expect(result.success).toBe(true);
    });

    it("should successfully bulk toggle rules", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", { success: true });

      const result = await toggleRentNotificationRules(["rule-1", "rule-2"], true, "tenant-1");
      expect(result.success).toBe(true);
    });
  });

  describe("testSendRentNotification", () => {
    it("should successfully send test rent notification flex message", async () => {
      mockSupabase
        .mockTableResult("rent_notification_rules_v3", {
          id: "rule-1",
          property_id: "prop-1",
          channel_id: "group-1",
          language: "th",
          properties: { rent_price: 15000, currency: "THB", details: { title: { th: "Condo A" } }, property_images: [] },
          channel: { id: "group-1" },
        })
        .mockTableResult("crm_deals_v3", {
          id: "contract-1",
          transaction_end_date: "2026-12-31",
        })
        .mockTableResult("rent_notification_history_v3", { success: true });

      const result = await testSendRentNotification("rule-1", "tenant-1");
      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.line.me/v2/bot/message/push",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should handle error when no active rental contract found", async () => {
      mockSupabase
        .mockTableResult("rent_notification_rules_v3", {
          id: "rule-1",
          property_id: "prop-1",
          channel_id: "group-1",
          language: "th",
          properties: { rent_price: 15000, currency: "THB", details: { title: { th: "Condo A" } }, property_images: [] },
          channel: { id: "group-1" },
        })
        .mockTableResult("crm_deals_v3", null); // No active contract

      const result = await testSendRentNotification("rule-1", "tenant-1");
      expect(result.success).toBe(false);
      expect(result.message).toContain("No active rental contract found");
    });
  });

  describe("getRentNotificationRules", () => {
    it("should fetch rules successfully with branch filtering", async () => {
      mockSupabase.mockTableResult("rent_notification_rules_v3", [
        { id: "rule-1", property_id: "prop-1", tenant_id: "tenant-1", property: { details: { title: "A" }, channel: {}, tenant: {} } },
      ], 1);

      const result = await getRentNotificationRules(1, 20, "tenant-1");
      expect(result.rules).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });
});
