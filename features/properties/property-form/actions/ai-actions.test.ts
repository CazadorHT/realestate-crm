import { describe, it, expect, vi, beforeEach } from "vitest";
import { sortPropertyImagesAction } from "./ai-actions";
import { generateText } from "@/lib/ai/gemini";
import { globalMockSupabase } from "@/tests/mocks/supabase";

// Mock global dependencies
vi.mock("@/features/ai-monitor/actions", () => ({
  logAiUsage: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/features/ai-settings/actions", () => ({
  getAiModelConfig: vi.fn().mockResolvedValue({
    description_model: "gemini-flash-lite-latest",
  }),
}));

describe("AI Image Sorting Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default download mock for storage
    globalMockSupabase.storage.download = vi.fn().mockResolvedValue({
      data: {
        arrayBuffer: async () => new ArrayBuffer(8),
        type: "image/webp",
      },
      error: null,
    });
  });

  const mockPaths = ["temp/img1.webp", "temp/img2.webp", "temp/img3.webp"];

  it("should return early if less than 2 images are provided", async () => {
    const res = await sortPropertyImagesAction(["temp/img1.webp"]);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img1.webp"]);
  });

  it("should successfully sort images when AI returns a clean JSON array", async () => {
    (generateText as any).mockResolvedValue({
      text: "[2, 0, 1]",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img3.webp", "temp/img1.webp", "temp/img2.webp"]);
  });

  it("should successfully sort images when AI returns a JSON array wrapped in markdown blocks", async () => {
    (generateText as any).mockResolvedValue({
      text: "```json\n[2, 0, 1]\n```",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img3.webp", "temp/img1.webp", "temp/img2.webp"]);
  });

  it("should successfully sort images when AI returns an object with sortedIndices key", async () => {
    (generateText as any).mockResolvedValue({
      text: '{"sortedIndices": [2, 0, 1]}',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img3.webp", "temp/img1.webp", "temp/img2.webp"]);
  });

  it("should successfully sort images when AI returns an object with sorted_indices key", async () => {
    (generateText as any).mockResolvedValue({
      text: '{"sorted_indices": [2, 0, 1]}',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img3.webp", "temp/img1.webp", "temp/img2.webp"]);
  });

  it("should successfully sort images when AI returns an object containing string indices", async () => {
    (generateText as any).mockResolvedValue({
      text: '{"indices": ["2", "0", "1"]}',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img3.webp", "temp/img1.webp", "temp/img2.webp"]);
  });

  it("should successfully sort images when AI returns double-encoded JSON", async () => {
    (generateText as any).mockResolvedValue({
      text: '"[2, 0, 1]"',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(true);
    expect(res.sortedPaths).toEqual(["temp/img3.webp", "temp/img1.webp", "temp/img2.webp"]);
  });

  it("should throw error if indices length does not match input images", async () => {
    (generateText as any).mockResolvedValue({
      text: "[2, 0]",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(false);
    expect(res.message).toBe("Invalid sorting index structure returned by AI");
  });

  it("should throw error if indices contains duplicates or invalid ranges", async () => {
    (generateText as any).mockResolvedValue({
      text: "[2, 2, 0]",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const res = await sortPropertyImagesAction(mockPaths);
    expect(res.success).toBe(false);
    expect(res.message).toBe("Invalid sorting index structure returned by AI");
  });
});
