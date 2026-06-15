import { describe, it, expect, vi } from 'vitest';
import { generateBlogPost } from './ai-service';

// Mock getAiModelConfig to return a test model
vi.mock('@/features/ai-settings/actions', () => ({
  getAiModelConfig: vi.fn().mockResolvedValue({
    blog_generator_model: 'gemini-1.5-flash',
  }),
}));

// Mock logAiUsage and other external services
vi.mock('@/features/ai-monitor/actions', () => ({
  logAiUsage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('./storage-service', () => ({
  uploadBlogImage: vi.fn().mockResolvedValue({ success: true, data: { publicUrl: 'https://test.com/img.png' } }),
}));

// ⚡ MOCK AI RESPONSE
vi.mock('@/lib/ai/gemini', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      title: "หัวข้อทดสอบ",
      slug: "test-slug",
      excerpt: "เนื้อหาเกริ่นนำ",
      content: "<h1>เนื้อหาหลัก</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>",
      category: "General",
      tags: "test, mock",
      seo_score: 99,
      seo_feedback: "ดีมาก"
    }),
    usage: { promptTokens: 10, completionTokens: 20 }
  }),
  generateImagenImage: vi.fn().mockResolvedValue(Buffer.from("mockImageBytes")),
}));

// Mock global fetch to avoid network calls in generateAndUploadAiImage
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
});

describe('AI Blog Service - JSON Robustness', () => {
  it('should return valid JSON structure for a standard keyword', async () => {
    // Note: In real test env, this might actually call the AI or we should mock gemini.
    // For this demonstration, we are testing the logic around the call.
    const result = await generateBlogPost(
      'คอนโดติดรถไฟฟ้า 2026',
      'นักลงทุนอสังหา',
      'Professional',
      'Short'
    );

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('content');
    expect(typeof result.title).toBe('string');
    expect(result.content.length).toBeGreaterThan(100);
  }, 30000); // 30s timeout for AI

  it('should handle "Long" articles without breaking JSON', async () => {
    const result = await generateBlogPost(
      'เจาะลึกทาวน์โฮม บางนา-ตราด',
      'ครอบครัวขยาย',
      'Educational',
      'Long'
    );

    expect(result.seo_score).toBeGreaterThanOrEqual(0);
    expect(result.tags).toBeDefined();
  }, 60000); // 60s for long content
});
