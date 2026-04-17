import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePropertyValuation } from './avm';
import { requireAuthContext } from '@/lib/authz';
import { generateText } from '@/lib/ai/gemini';
import { logAiUsage } from '@/features/ai-monitor/actions';

// 1. สร้าง Universal Mock แบบ Non-Blocking
const mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  // แก้ไขจุดตาย: ให้ return ค่าว่างเป็น Default เสมอเพื่อไม่ให้ await ค้าง
  then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
};

vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock('@/lib/ai/gemini', () => ({
  generateText: vi.fn(),
}));

vi.mock('@/features/ai-monitor/actions', () => ({
  logAiUsage: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/features/ai-settings/actions', () => ({
  getAiModelConfig: vi.fn().mockResolvedValue({ 
    blog_generator_model: 'gemini-1.5-flash' 
  }),
}));

describe('Property Actions - Hardened AVM Valuation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-link chains
    Object.values(mockSupabase).forEach((m: any) => {
      if (m && typeof m.mockReturnThis === 'function') m.mockReturnThis();
    });
    // Reset default success for then
    mockSupabase.then.mockImplementation((resolve: (arg0: { data: never[]; error: null; }) => any) => resolve({ data: [], error: null }));
  });

  const validParams = {
    propertyType: 'CONDO',
    listingType: 'SALE',
    sizeSqm: 50,
    district: 'Watthana',
  };

  it('should generate valuation successfully with clean JSON from AI', async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: 'tenant-1',
    });

    // จำลองข้อมูลสำหรับ getComparableProperties
    mockSupabase.then.mockImplementationOnce((resolve: (arg0: { data: { price: number; }[]; error: null; }) => any) => 
      resolve({ data: [{ price: 5000000 }], error: null })
    );

    const mockValuation = {
      maxProfitPrice: 5500000,
      marketPrice: 5000000,
      quickSalePrice: 4500000,
      estimatedYieldPercent: 5.0,
      confidenceScore: 'HIGH',
      analysisSummary: 'ราคาเหมาะสม',
    };
    
    (generateText as any).mockResolvedValueOnce({
      text: JSON.stringify(mockValuation),
      usage: { promptTokens: 100, completionTokens: 50 },
    });

    const result = await generatePropertyValuation(validParams);

    expect(result.marketPrice).toBe(5000000);
    expect(mockSupabase.eq).toHaveBeenCalledWith("district", "Watthana");
    expect(logAiUsage).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  it('should handle AI Hallucination (Malformed JSON) and throw a safe error', async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: 'tenant-1',
    });

    // ในเคสนี้ไม่ต้อง mock then เพิ่ม เพราะตัว default ใน beforeEach จะจัดการให้
    (generateText as any).mockResolvedValueOnce({
      text: 'AI Hallucinated text here',
      usage: { promptTokens: 10, completionTokens: 5 },
    });

    // ตรวจสอบว่าระบบโยน Error ที่สุภาพออกมา และไม่ใช้เวลานานเกินกำหนด
    await expect(generatePropertyValuation(validParams))
      .rejects.toThrow("Unable to generate valuation at this time.");

    expect(logAiUsage).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
  });
});