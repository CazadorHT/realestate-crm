import { describe, it, expect, vi, beforeEach } from 'vitest';
import { duplicatePropertyAction } from './create';
import { requireAuthContext } from '@/lib/authz';

// 1. Mock Authz แบบ Auto-mock (วิธีที่เสถียรที่สุดสำหรับ Named Exports)
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  AuthzError: class AuthzError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message || code);
      this.code = code;
      this.name = 'AuthzError';
    }
  }
}));

// 2. Mock Globals อื่นๆ (เหมือนเดิมแต่แก้ crypto ให้สมบูรณ์)
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return { ...actual, randomUUID: () => "test-uuid-1234" };
});

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

vi.mock('@/lib/seo-utils', () => ({
  generatePropertySEO: vi.fn(() => ({
    slug: 'mock-slug',
    metaTitle: 'Mock Title',
    metaDescription: 'Mock Desc',
    metaKeywords: [],
    structuredData: {},
  })),
}));

vi.mock('@/lib/inngest/client', () => ({ inngest: { send: vi.fn().mockResolvedValue({}) } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));

// 3. Universal Supabase Mock (คงเดิม)
const mockStorage = { copy: vi.fn().mockResolvedValue({ data: {}, error: null }) };
const mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
  storage: { from: vi.fn().mockReturnValue(mockStorage) },
  then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
};

describe('Property Actions - Hardened Duplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.then.mockImplementation((resolve: (arg0: { data: never[]; error: null; }) => any) => resolve({ data: [], error: null }));
  });

  it('should reset sensitive fields and generate unique slug when duplicating', async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'user-1' } as any,
      role: 'AGENT',
      tenantId: 't1',
    });

    // 1. properties_core select
    // 2. properties_details select
    // 3. properties_core insert
    mockSupabase.single
      .mockResolvedValueOnce({ 
        data: { 
          id: 'old-123', status: 1, listing_type: 0, property_type: 1, sale_price: 5000000,
          bedrooms: 2, bathrooms: 2, floor_area: 50, land_area: 0
        }, 
        error: null 
      })
      .mockResolvedValueOnce({ 
        data: { 
          property_id: 'old-123', title: { th: 'Condo' }, description: { th: 'Desc' },
          address_info: { th: 'Addr' }, pricing_details: {}, meta_data: { slug: 'old-slug' }
        }, 
        error: null 
      })
      .mockResolvedValueOnce({ data: { id: 'new-456' }, error: null });

    // 4. property_media_v3 select (for old media) - used twice in the code (lines 337 and 423)
    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }))
      .mockImplementation((resolve: any) => resolve({ data: [], error: null }));

    const result = await duplicatePropertyAction('old-123');

    expect(result.success).toBe(true);
    expect(result.propertyId).toBe('new-456');

    const coreInsertPayload = mockSupabase.insert.mock.calls[0][0];
    expect(coreInsertPayload.status).toBe(0); // Should be reset to DRAFT (0)
  });

  it('should clone related records (Multi-table integrity)', async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'user-1' } as any,
      role: 'AGENT',
      tenantId: 't1',
    });

    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'old-id', status: 1 }, error: null })
      .mockResolvedValueOnce({ data: { id: 'old-id', title: { th: 'Prop' } }, error: null })
      .mockResolvedValueOnce({ data: { id: 'new-id' }, error: null });

    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ url: 'u1', storage_path: 'p1', is_cover: true }], error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ url: 'u1', storage_path: 'p1', is_cover: true }], error: null }))
      .mockImplementation((resolve: any) => resolve({ error: null }));

    const result = await duplicatePropertyAction('old-id');

    expect(result.success).toBe(true);
  });
});