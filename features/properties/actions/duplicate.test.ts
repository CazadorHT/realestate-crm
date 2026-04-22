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

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/seo-utils', () => ({
  generatePropertySEO: vi.fn(() => ({
    slug: 'mock-slug',
    metaTitle: 'Mock Title',
    metaDescription: 'Mock Desc',
    metaKeywords: [],
    structuredData: {},
  })),
}));

vi.mock('@/lib/inngest/client', () => ({ inngest: { send: vi.fn() } }));
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
    // ใช้ vi.mocked เพื่อให้ TypeScript รู้ว่าเป็น mock function
    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase,
      user: { 
        id: 'user-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any,
      role: 'AGENT',
      tenantId: 't1',
    });

    mockSupabase.single
      .mockResolvedValueOnce({ 
        data: { id: 'old-123', title: 'Condo', view_count: 500, verified: true, tenant_id: 't1' }, 
        error: null 
      })
      .mockResolvedValueOnce({ data: { id: 'new-456' }, error: null });

    const result = await duplicatePropertyAction('old-123');

    expect(result.success).toBe(true);
    expect(result.propertyId).toBe('new-456');

    const insertPayload = mockSupabase.insert.mock.calls[0][0];
    expect(insertPayload.view_count).toBe(0);
    expect(insertPayload.verified).toBe(false);
  });

  it('should clone related records (Multi-table integrity)', async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase,
      user: { 
        id: 'user-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any,
      role: 'AGENT',
      tenantId: 't1',
    });

    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'old-id', title: 'Prop' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'new-id' }, error: null });

    // 🛡️ CRITICAL FIX: .then() must call the resolve function
    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ image_url: 'u1', storage_path: 'p1', is_cover: true }], error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ agent_id: 'a1' }], error: null }))
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ feature_id: 'f1' }], error: null }))
      .mockImplementation((resolve: any) => resolve({ error: null }));

    const result = await duplicatePropertyAction('old-id');

    expect(result.success).toBe(true);
    expect(mockStorage.copy).toHaveBeenCalled();
  });
});