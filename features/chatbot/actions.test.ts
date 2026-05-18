import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Chatbot Module - Actions (เทสโหดๆ แบบไม่อวย)", () => {
  let chatWithAI: any;
  let mockGetAiModelConfig: any;
  let mockGetModel: any;
  let mockLogAiUsage: any;
  let mockSearchPropertiesForChatbot: any;
  let mockChatSession: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    mockGetAiModelConfig = vi.fn().mockResolvedValue({ chatbot_model: "gemini-1.5-flash" });
    vi.doMock("@/features/ai-settings/actions", () => ({
      getAiModelConfig: mockGetAiModelConfig,
    }));

    mockChatSession = {
      sendMessage: vi.fn().mockResolvedValue({
        response: {
          text: () => "สวัสดีครับ ผมเป็นผู้ช่วยอสังหาฯ ยินดีให้บริการครับ",
          functionCalls: () => [],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
        },
      }),
    };

    mockGetModel = vi.fn().mockReturnValue({
      startChat: vi.fn().mockReturnValue(mockChatSession),
    });

    vi.doMock("@/lib/ai/gemini", () => ({
      getModel: mockGetModel,
    }));

    mockLogAiUsage = vi.fn().mockResolvedValue({ success: true });
    vi.doMock("@/features/ai-monitor/actions", () => ({
      logAiUsage: mockLogAiUsage,
    }));

    mockSearchPropertiesForChatbot = vi.fn().mockResolvedValue([
      {
        id: "prop-1",
        title: "Condo Asoke",
        price: 5000000,
        rental_price: 25000,
        location: "Asoke",
        slug: "condo-asoke",
        image_url: "http://example.com/img.jpg",
        listing_type: "SALE_AND_RENT",
        features: [{ id: "f1", name: "Pool", icon_key: "pool" }],
      },
    ]);

    vi.doMock("@/lib/services/chatbot-properties", () => ({
      searchPropertiesForChatbot: mockSearchPropertiesForChatbot,
    }));

    const actions = await import("./actions");
    chatWithAI = actions.chatWithAI;
  });

  it("should return missing API key message if model is null", async () => {
    mockGetModel.mockReturnValue(null);

    const result = await chatWithAI([], "สวัสดี");
    expect(result.text).toContain("ระบบ AI ยังไม่พร้อมใช้งาน");
  });

  it("should successfully chat and return text response", async () => {
    const result = await chatWithAI([], "สวัสดี");
    expect(result.text).toBe("สวัสดีครับ ผมเป็นผู้ช่วยอสังหาฯ ยินดีให้บริการครับ");
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", feature: "chatbot" })
    );
  });

  it("should handle function call search_properties and return property results", async () => {
    mockChatSession.sendMessage
      .mockResolvedValueOnce({
        response: {
          text: () => "",
          functionCalls: () => [
            {
              name: "search_properties",
              args: { location: "Asoke", transaction: "buy", minPrice: 3000000 },
            },
          ],
          usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 5 },
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => "พบ 1 รายการที่น่าสนใจย่าน Asoke ครับ",
          functionCalls: () => [],
          usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 25 },
        },
      });

    const result = await chatWithAI([], "หาคอนโดอโศก งบ 3 ล้าน");
    expect(result.text).toBe("พบ 1 รายการที่น่าสนใจย่าน Asoke ครับ");
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].title).toBe("Condo Asoke");
    expect(mockSearchPropertiesForChatbot).toHaveBeenCalledWith(
      expect.objectContaining({ district: "Asoke", minPrice: 3000000, listingType: "SALE" })
    );
  });

  it("should retry on 429 rate limit error and succeed", async () => {
    mockChatSession.sendMessage
      .mockRejectedValueOnce({ status: 429, message: "Too Many Requests" })
      .mockResolvedValueOnce({
        response: {
          text: () => "ขออภัยที่ให้รอครับ มีคอนโดแนะนำดังนี้...",
          functionCalls: () => [],
        },
      });

    const result = await chatWithAI([], "หาบ้าน");
    expect(result.text).toBe("ขออภัยที่ให้รอครับ มีคอนโดแนะนำดังนี้...");
    expect(mockChatSession.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("should fail gracefully after max retries or fatal error", async () => {
    mockChatSession.sendMessage.mockRejectedValue(new Error("FATAL_AI_ERROR"));

    const result = await chatWithAI([], "หาบ้าน");
    expect(result.text).toContain("เกิดข้อผิดพลาดในการประมวลผล");
    expect(mockLogAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error", errorMessage: "FATAL_AI_ERROR" })
    );
  });
});
