import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bulkDeleteDealsAction, getAllDealIdsAction } from './bulk-actions';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Bulk Deals Actions', () => {
  const tenantId = 'test-tenant-id';
  
  const createMockQuery = (data: any = [], error: any = null) => {
    const query: any = {
      data,
      error,
      select: vi.fn().mockImplementation(() => query),
      eq: vi.fn().mockImplementation(() => query),
      in: vi.fn().mockImplementation(() => query),
      delete: vi.fn().mockImplementation(() => query),
      single: vi.fn().mockImplementation(() => query),
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

  describe('bulkDeleteDealsAction', () => {
    it('should delete multiple deals within tenant boundary', async () => {
      const ids = ['deal-1', 'deal-2'];
      mockQuery.data = { count: 2 };

      const result = await bulkDeleteDealsAction(ids);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', tenantId);
      expect(mockQuery.in).toHaveBeenCalledWith('id', ids);
    });

    it('should return error if no IDs provided', async () => {
      const result = await bulkDeleteDealsAction([]);
      expect(result.success).toBe(false);
      expect(result.message).toBe('ไม่มีรายการที่เลือก');
    });
  });

  describe('getAllDealIdsAction', () => {
    it('should fetch all matching deal IDs', async () => {
      // Mock the dynamic import of queries 
      vi.mock('./queries.getDeals', () => ({
        getAllDealIdsQuery: vi.fn().mockResolvedValue(['id-1', 'id-2'])
      }));

      const result = await getAllDealIdsAction({ q: 'test' });
      expect(result.success).toBe(true);
      expect(result.ids).toEqual(['id-1', 'id-2']);
    });
  });
});
