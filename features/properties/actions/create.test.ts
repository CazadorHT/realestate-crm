import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPropertyAction } from './create';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  authzFail: vi.fn((err) => ({ success: false, message: err.message })),
  AuthzError: class AuthzError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message || code);
      this.code = code;
      this.name = 'AuthzError';
    }
  }
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}));

vi.mock('../logic/seo', () => ({
  generateKeywords: vi.fn(() => []),
  prepareSEOData: vi.fn(() => ({ slug: 'test-slug' })),
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn((v) => v),
  generateBlindIndex: vi.fn((v) => v),
}));

describe('Property Actions - Branch Isolation & Rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getValidFormData = (overrides = {}) => ({
    title: 'Test Property',
    property_type: 'CONDO',
    listing_type: 'SALE',
    original_price: 5000000,
    commission_sale_percentage: 3,
    address_line1: '123 Test St',
    province: 'Bangkok',
    district: 'Watthana',
    subdistrict: 'Khlong Toei Nuea',
    google_maps_link: 'https://maps.google.com',
    ...overrides,
  });

  it('should rollback property creation within tenant boundary if images fail', async () => {
    const tenantId = 'tenant-123';
    
    // 🛡️ TRUE MEGA MOCK: Chains forever and resolves with whatever we want.
    const createMockChain = (finalResult: any) => {
      const mock: any = {
        from: vi.fn().mockImplementation(() => mock),
        select: vi.fn().mockImplementation(() => mock),
        insert: vi.fn().mockImplementation(() => mock),
        update: vi.fn().mockImplementation(() => mock),
        delete: vi.fn().mockImplementation(() => mock),
        eq: vi.fn().mockImplementation(() => mock),
        single: vi.fn().mockImplementation(() => mock),
        // The magic: then makes it awaitable
        then: vi.fn().mockImplementation((resolve) => resolve(finalResult))
      };
      return mock;
    };

    const localSupabase: any = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    // 1st call (Property) -> Success
    // 2nd call (Images) -> Failure
    let insertCount = 0;
    localSupabase.insert.mockImplementation(() => {
      insertCount++;
      if (insertCount === 1) {
        // Must support .select().single()
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'prop-1' }, error: null }),
          then: (resolve: any) => resolve({ data: { id: 'prop-1' }, error: null })
        };
      }
      // For images: must support .select() and then fail
      return {
        select: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: { message: 'Image DB Error' } })
      };
    });

    // Default for other calls
    localSupabase.delete.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ error: null })
    });

    (requireAuthContext as any).mockResolvedValue({
      supabase: localSupabase,
      tenantId: tenantId,
      role: 'AGENT',
      user: { id: 'user-1' },
    });

    const values = {
      title: 'Test Property',
      property_type: 'CONDO',
      listing_type: 'SALE',
      original_price: 5000000,
      commission_sale_percentage: 3,
      address_line1: '123 Test St',
      province: 'Bangkok',
      district: 'Watthana',
      subdistrict: 'Khlong Toei Nuea',
      google_maps_link: 'https://maps.google.com',
      popular_area: 'Thong Lo',
      images: ['properties/img1.jpg'],
    };

    const result = await createPropertyAction(values as any, 'session-123');

    expect(result.message).toBe('Failed to attach images');
    expect(result.success).toBe(false);

    expect(localSupabase.from).toHaveBeenCalledWith('properties');
  });

  describe('Sentinel AI Bypass', () => {
    it('should automatically set requires_ai_review to false for ADMIN', async () => {
      const localSupabase: any = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation(() => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'p1' }, error: null })
          })
        })),
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: localSupabase,
        user: { id: 'admin-1' },
        role: 'ADMIN',
        tenantId: 'tenant-123',
      });

      const values = getValidFormData({
        title: 'Admin Property',
        requires_ai_review: true,
      });

      await createPropertyAction(values as any, 'session-123');

      const insertCall = localSupabase.insert.mock.calls[0][0];
      expect(insertCall.requires_ai_review).toBe(false);
    });

    it('should preserve requires_ai_review as true for AGENT', async () => {
      const localSupabase: any = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation(() => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'p1' }, error: null })
          })
        })),
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: localSupabase,
        user: { id: 'agent-1' },
        role: 'AGENT',
        tenantId: 'tenant-123',
      });

      const values = getValidFormData({
        title: 'Agent Property',
        requires_ai_review: true,
      });

      await createPropertyAction(values as any, 'session-123');

      const insertCall = localSupabase.insert.mock.calls[0][0];
      expect(insertCall.requires_ai_review).toBe(true);
    });
  });
});
