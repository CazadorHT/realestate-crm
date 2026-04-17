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
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnThis(),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
  })),
}));

describe('Property Bulk Actions - Hardened Security & Isolation', () => {
  const mockTenantId = 't1';
  const mockUserId = 'u1';

  // 🛡️ Dedicated Local Mock to prevent pollution
  const mockSupabase: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn(),
    storage: {
      from: vi.fn().mockReturnThis(),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
    then: vi.fn().mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.delete.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.in.mockReturnValue(mockSupabase);
    mockSupabase.then.mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 }));

    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: mockUserId, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'AGENT',
      tenantId: mockTenantId,
    });
    vi.mocked(isAdmin).mockReturnValue(false);
  });

  describe('bulkDeletePropertiesAction', () => {
    it('should filter out restricted statuses and only soft-delete safe properties', async () => {
      const ids = ['p1', 'p2', 'p3'];

      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: [{ id: 'p1', status: 'ACTIVE' }, { id: 'p2', status: 'SOLD' }], 
          error: null 
        })) // status query
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: [{ property_id: 'p3' }], 
          error: null 
        })) // deals query
        .mockImplementationOnce((resolve: any) => resolve({ count: 1, error: null })); // final update

      const result = await bulkDeletePropertiesAction(ids);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      
      // ✅ Verify isolation
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ['p1']);
    });
  });

  describe('bulkPermanentDeletePropertiesAction', () => {
    it('should verify ownership and trigger storage cleanup for safe properties', async () => {
      const ids = ['p1'];

      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'p1' }], error: null })) // verify query
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'p1', status: 'ACTIVE' }], error: null })) // status check
        .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null })) // deals check
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }], error: null })) // images fetch
        .mockImplementation((resolve: any) => resolve({ count: 1, error: null })); // deletes

      const result = await bulkPermanentDeletePropertiesAction(ids);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('property_images');
    });
  });

  describe('bulkRestorePropertiesAction', () => {
    it('should enforce tenant isolation during bulk restore', async () => {
      mockSupabase.then.mockImplementation((resolve: any) => resolve({ count: 1, error: null }));

      const result = await bulkRestorePropertiesAction(['p1']);

      expect(result.success).toBe(true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });
  });
});
