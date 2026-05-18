import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Omni-Channel Module - Actions & Queries (เทสโหดๆ แบบไม่อวย)", () => {
  let sendDirectReplyAction: any;
  let replyToCommentAction: any;
  let getLeadMessagesAction: any;
  let updateLeadCategoryAction: any;
  let markLeadMessagesAsReadAction: any;
  let getInboxConversationsQuery: any;

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

    vi.doMock("@/lib/actions/system-config", () => ({
      getSystemConfig: vi.fn().mockResolvedValue({
        multi_tenant_enabled: true,
      }),
    }));

    vi.doMock("@/lib/line", () => ({
      saveOmniMessage: vi.fn().mockResolvedValue({ success: true }),
    }));

    vi.doMock("@/lib/meta", () => ({
      sendMetaMessage: vi.fn().mockResolvedValue({ success: true }),
      sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
      replyToMetaComment: vi.fn().mockResolvedValue({ success: true }),
    }));

    vi.doMock("@/lib/crypto", () => ({
      decrypt: vi.fn((val) => val), // Return raw for test simplicity
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    // Mock fetch for LINE API
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(""),
    });

    const actions = await import("./actions");
    const queries = await import("./queries");

    sendDirectReplyAction = actions.sendDirectReplyAction;
    replyToCommentAction = actions.replyToCommentAction;
    getLeadMessagesAction = actions.getLeadMessagesAction;
    updateLeadCategoryAction = actions.updateLeadCategoryAction;
    markLeadMessagesAsReadAction = actions.markLeadMessagesAsReadAction;
    getInboxConversationsQuery = queries.getInboxConversationsQuery;
  });

  describe("sendDirectReplyAction", () => {
    it("should successfully send LINE direct reply and save omni message", async () => {
      mockSupabase.mockTableResult("crm_leads_v3", {
        source: "LINE",
        identity: { line_id: "line-123", phone: "0811111111", social_links: {} },
      });

      const result = await sendDirectReplyAction("lead-1", "สวัสดีครับ");
      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/push"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should handle missing lead data gracefully", async () => {
      mockSupabase.mockTableResult("crm_leads_v3", null); // Lead not found

      const result = await sendDirectReplyAction("lead-1", "สวัสดีครับ");
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูลลูกค้า");
    });
  });

  describe("replyToCommentAction", () => {
    it("should successfully reply to Meta comment", async () => {
      mockSupabase
        .mockTableResult("communications_hub_v3", {
          external_message_id: "ext-1",
          identity_id: "id-1",
          platform: "FACEBOOK",
          tenant_id: "tenant-1",
        })
        .mockTableResult("crm_leads_v3", { id: "lead-1" });

      const result = await replyToCommentAction("msg-1", "ตอบกลับคอมเมนต์ครับ");
      expect(result.success).toBe(true);
    });

    it("should handle error when comment not found", async () => {
      mockSupabase.mockTableResult("communications_hub_v3", null);

      const result = await replyToCommentAction("msg-1", "ตอบกลับคอมเมนต์ครับ");
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อความต้นฉบับ");
    });
  });

  describe("getLeadMessagesAction", () => {
    it("should fetch lead messages successfully", async () => {
      mockSupabase
        .mockTableResult("crm_leads_v3", { created_at: "2026-01-01", source: "LINE", identity_id: "id-1" })
        .mockTableResult("communications_hub_v3", [
          { id: "m1", content: "Hi", direction: 0, platform: "LINE", created_at: "2026-01-02" },
        ]);

      const result = await getLeadMessagesAction("lead-1");
      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(1);
      expect(result.messages![0].direction).toBe("INCOMING");
    });

    it("should handle errors when fetching messages", async () => {
      mockSupabase.mockTableResult("crm_leads_v3", null);

      const result = await getLeadMessagesAction("lead-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูลลูกค้า");
    });
  });

  describe("updateLeadCategoryAction", () => {
    it("should successfully update lead category", async () => {
      mockSupabase
        .mockTableResult("crm_leads_v3", { utm_data: {} }) // select
        .mockTableResult("crm_leads_v3", { success: true }); // update

      const result = await updateLeadCategoryAction("lead-1", "CUSTOMER");
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should reject invalid category string", async () => {
      const result = await updateLeadCategoryAction("lead-1", "INVALID_CAT");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid category");
    });
  });

  describe("markLeadMessagesAsReadAction", () => {
    it("should mark messages as read successfully", async () => {
      mockSupabase
        .mockTableResult("crm_leads_v3", { identity_id: "id-1" }) // select
        .mockTableResult("communications_hub_v3", { success: true }); // update

      const result = await markLeadMessagesAsReadAction("lead-1");
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_read: true });
    });
  });

  describe("getInboxConversationsQuery", () => {
    it("should fetch inbox conversations successfully", async () => {
      mockSupabase.mockTableResult("crm_leads_v3", [
        {
          id: "lead-1",
          source: "LINE",
          tenant_id: "tenant-1",
          utm_data: {},
          ai_summary: "Note",
          identity: {
            id: "id-1",
            display_name: "Customer A",
            communications_hub_v3: [{ id: "m1", content: "Hello", direction: 0 }],
          },
          tenants: { id: "tenant-1", name: "HQ" },
        },
      ]);

      const convs = await getInboxConversationsQuery();
      expect(convs).toHaveLength(1);
      expect(convs[0].full_name).toBe("Customer A");
      expect(convs[0].omni_messages).toHaveLength(1);
    });
  });
});
