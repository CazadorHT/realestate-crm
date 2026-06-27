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

vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAuthenticated: vi.fn(),
  isAdmin: vi.fn(),
  authzFail: vi.fn((err: any) => ({ success: false, message: err.message })),
  AuthzError: class AuthzError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message || code);
      this.code = code;
      this.name = 'AuthzError';
    }
  }
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(null) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

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
    const { inngest } = await import('@/lib/inngest/client');
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
      role: 'ADMIN',
      tenantId: 'tenant-1',
    });
    (isAdmin as any).mockReturnValue(true);

    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', created_by: 'admin-1', tenant_id: 'tenant-1' }, error: null });

    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ count: 0, error: null })) // 2. deal check
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }], error: null })) // 3. images select
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 4. details delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 5. media delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 6. agents delete
      .mockImplementationOnce((resolve: any) => resolve({ error: null })) // 7. features delete
      .mockImplementationOnce((resolve: any) => resolve({ error: { code: '23503', message: 'FK Conflict' } })); // 💥 8. MAIN DELETE FAILS

    const result = await deletePropertyAction(getMockFormData('p1'));

    expect(result.success).toBe(false);
    expect(result.message).toContain('ลบไม่สำเร็จ');
    
    // ⚖️ CRITICAL: If DB delete fails, storage cleanup must NOT be triggered
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it('should allow deletion and trigger storage cleanup ONLY after DB success', async () => {
    const { inngest } = await import('@/lib/inngest/client');
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
      role: 'ADMIN',
      tenantId: 't1',
    });
    (isAdmin as any).mockReturnValue(true);

    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'p1', created_by: 'admin-1', tenant_id: 't1' }, error: null });
    
    // All success sequence
    mockSupabase.then
      .mockImplementationOnce((resolve: any) => resolve({ count: 0, error: null })) // deals
      .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }], error: null })) // images select
      .mockImplementation((resolve: any) => resolve({ error: null })); // all other deletes success

    const result = await deletePropertyAction(getMockFormData('p1'));

    expect(result.success).toBe(true);
    // ✅ Storage cleanup triggered in background via Inngest
    expect(inngest.send).toHaveBeenCalledWith(expect.objectContaining({
      name: 'storage.cleanup.requested',
      data: expect.objectContaining({
        paths: ['img.jpg']
      })
    }));
  });
});