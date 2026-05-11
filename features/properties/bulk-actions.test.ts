import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  bulkDeletePropertiesAction, 
  bulkPermanentDeletePropertiesAction,
  bulkRestorePropertiesAction
} from './bulk-actions';
import { requireAuthContext, isAdmin } from '@/lib/authz';

// 1. Mock Dependencies
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(null) }));
vi.mock('next/cache', () => ({ 
  revalidatePath: vi.fn(), 
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({}),
  },
}));

describe('Property Bulk Actions - Isolated & Hardened', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createLocalSupabase = () => {
    const mock: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn().mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 })),
    };
    return mock;
  };

  describe('bulkDeletePropertiesAction', () => {
    it('should filter out restricted statuses and only soft-delete safe properties', async () => {
      const supabase = createLocalSupabase();
      const ids = ['p1', 'p2', 'p3'];

      (requireAuthContext as any).mockResolvedValue({
        supabase,
        user: { id: 'u1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      supabase.then
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: [{ id: 'p1', status: 'ACTIVE' }, { id: 'p2', status: 'SOLD' }], 
          error: null 
        })) // 1. properties status query
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: [{ property_id: 'p3' }], 
          error: null 
        })); // 2. deals query
      
      supabase.rpc.mockResolvedValueOnce({ count: 1, error: null });

      const result = await bulkDeletePropertiesAction(ids);

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('bulk_trash_properties', {
        p_ids: ['p1']
      });
    });
  });

  describe('bulkPermanentDeletePropertiesAction', () => {
    it('should verify ownership and trigger storage cleanup for safe properties', async () => {
      const { inngest } = await import('@/lib/inngest/client');
      const supabase = createLocalSupabase();
      const ids = ['p1'];

      (requireAuthContext as any).mockResolvedValue({
        supabase,
        user: { id: 'u1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      supabase.then
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'p1' }], error: null })) // 1. verify query
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'p1', status: 'ACTIVE' }], error: null })) // 2. status check
        .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null })) // 3. deals check
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }], error: null })); // 4. images fetch
      
      supabase.rpc.mockResolvedValueOnce({ count: 1, error: null });

      const result = await bulkPermanentDeletePropertiesAction(ids);

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('bulk_hard_delete_properties', {
        p_ids: ['p1']
      });
      
      expect(inngest.send).toHaveBeenCalledWith(expect.objectContaining({
        name: 'storage.cleanup.requested'
      }));
    });
  });

  describe('bulkRestorePropertiesAction', () => {
    it('should enforce tenant isolation during bulk restore', async () => {
      const supabase = createLocalSupabase();
      (requireAuthContext as any).mockResolvedValue({
        supabase,
        user: { id: 'u1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      supabase.then.mockImplementation((resolve: any) => resolve({ count: 1, error: null }));

      const result = await bulkRestorePropertiesAction(['p1']);

      expect(result.success).toBe(true);
      expect(supabase.eq).toHaveBeenCalledWith('tenant_id', 't1');
    });
  });
});
