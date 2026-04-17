import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deletePropertyAction } from './delete';
import { requireAuthContext, isAdmin } from '@/lib/authz';

/**
 * 🛠️ Precision Mocking for Chained Methods & Thenables
 */
const mockStorage = {
  remove: vi.fn().mockResolvedValue({ data: [], error: null }),
};

const mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  storage: { from: vi.fn().mockReturnValue(mockStorage) },
  // 🛡️ Global Then Resolver: Prevents Timeout by always executing the resolve callback
  then: vi.fn().mockImplementation((resolve: (val: any) => void) => resolve({ data: [], error: null, count: 0 })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAuthenticated: vi.fn(),
  isAdmin: vi.fn(),
  authzFail: vi.fn((err: any) => ({ success: false, message: err.message })),
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(null) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Property Actions - Hardened Deletion & Atomic Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.delete.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    
    // Default success for any awaited query
    mockSupabase.then.mockImplementation((resolve: (val: any) => void) => resolve({ data: [], error: null, count: 0 }));
  });

  const getMockFormData = (id: string) => {
    const fd = new FormData();
    fd.append('id', id);
    return fd;
  };

  it('should verify Transaction Integrity: DO NOT delete storage if DB fails', async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
      role: 'ADMIN',
      tenantId: 'tenant-1',
    });
    (isAdmin as any).mockReturnValue(true);

    // Sequence of awaited calls in delete.ts:
    // 1. Single (check owner) -> 2. Select (deals) -> 3. Select (images) -> 4. Update (leads) -> ... -> Main Delete
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', created_by: 'admin-1' }, error: null });

    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ count: 0, error: null })) // 2. deal check
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }], error: null })) // 3. images select
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 4. leads update
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 5. features delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 6. agents delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 7. matches delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 8. uploads delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 9. image rows delete
      .mockImplementationOnce((resolve: any) => resolve({ error: { code: '23503', message: 'FK Conflict' } })); // 💥 10. MAIN DELETE FAILS

    const result = await deletePropertyAction(getMockFormData('p1'));

    expect(result.success).toBe(false);
    expect(result.message).toContain('ลบไม่สำเร็จ');
    
    // ⚖️ CRITICAL: If DB delete fails, storage must remain intact
    expect(mockStorage.remove).not.toHaveBeenCalled();
  });

  it('should allow deletion and cleanup storage ONLY after DB success', async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
      role: 'ADMIN',
      tenantId: 't1',
    });
    (isAdmin as any).mockReturnValue(true);

    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', created_by: 'admin-1' }, error: null });
    
    // All success sequence
    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ count: 0, error: null })) // deals
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }], error: null })) // images select
      .mockImplementation((resolve: any) => resolve({ error: null })); // all other deletes success

    const result = await deletePropertyAction(getMockFormData('p1'));

    expect(result.success).toBe(true);
    // ✅ Storage remove only called on total success
    expect(mockStorage.remove).toHaveBeenCalledWith(['img.jpg']);
  });
});