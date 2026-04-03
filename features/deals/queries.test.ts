import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDealStats } from './queries.getDeals';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
}));

describe('Deals Queries - Stats', () => {
  const tenantId = 'test-tenant-id';
  
  // A helper to create a mock Supabase query builder that is both chainable and awaitable
  const createMockQuery = (data: any = [], error: any = null) => {
    const query: any = {
      data,
      error,
      select: vi.fn().mockImplementation(() => query),
      eq: vi.fn().mockImplementation(() => query),
      single: vi.fn().mockImplementation(() => query),
      // To make it awaitable (like a Promise)
      then: vi.fn().mockImplementation((onFulfilled) => 
        Promise.resolve({ data: query.data, error: query.error }).then(onFulfilled)
      ),
    };
    return query;
  };

  let mockQuery: any;
  const mockSupabase = {
    from: vi.fn().mockImplementation(() => mockQuery),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = createMockQuery();
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: 'user-1' },
      role: 'ADMIN',
      tenantId,
    });
  });

  describe('getDealStats', () => {
    it('should aggregate counts correctly from raw data', async () => {
      const mockData = [
        { deal_type: 'RENT', status: 'NEGOTIATING', property: { listing_type: 'RENT', property_type: 'CONDO' } },
        { deal_type: 'RENT', status: 'SIGNED', property: { listing_type: 'RENT', property_type: 'CONDO' } },
        { deal_type: 'SALE', status: 'CLOSED_WIN', property: { listing_type: 'SALE', property_type: 'HOUSE' } },
      ];

      mockQuery.data = mockData;

      const stats = await getDealStats();

      expect(stats).not.toBeNull();
      if (stats) {
        expect(stats.total).toBe(3);
        expect(stats.deal_type['RENT']).toBe(2);
        expect(stats.deal_type['SALE']).toBe(1);
        expect(stats.status['NEGOTIATING']).toBe(1);
        expect(stats.status['SIGNED']).toBe(1);
        expect(stats.status['CLOSED_WIN']).toBe(1);
        expect(stats.property_type['CONDO']).toBe(2);
        expect(stats.property_type['HOUSE']).toBe(1);
      }
    });

    it('should handle empty results', async () => {
      mockQuery.data = [];
      const stats = await getDealStats();
      expect(stats?.total).toBe(0);
    });

    it('should return null on error', async () => {
      console.error = vi.fn(); // Suppress error log
      mockQuery.data = null;
      mockQuery.error = { message: 'DB Error' };
      const stats = await getDealStats();
      expect(stats).toBeNull();
    });
  });
});
