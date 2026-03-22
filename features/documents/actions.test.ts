import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDocumentRecordAction, getDocumentSignedUrl } from './actions';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAdmin: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Document Actions - Branch Isolation', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    storage: {
      from: vi.fn().mockReturnThis(),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'signed-url' }, error: null }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should assign tenant_id automatically during document creation', async () => {
    const tenantId = 'tenant-123';
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: tenantId,
      role: 'AGENT',
      user: { id: 'user-1' },
    });

    mockSupabase.single.mockResolvedValue({ data: { id: 'doc-1' }, error: null });

    const input = {
      file_name: 'Test Doc',
      storage_path: 'path/to/file',
      document_type: 'OTHER',
      size_bytes: 1024,
      owner_type: 'LEAD',
      owner_id: '00000000-0000-0000-0000-000000000000',
    };

    await createDocumentRecordAction(input as any);

    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
      file_name: 'Test Doc',
      tenant_id: tenantId,
      created_by: 'user-1',
    }));
  });

  it('should verify tenant_id before generating signed URL', async () => {
    const tenantId = 'tenant-123';
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: tenantId,
      role: 'AGENT',
      user: { id: 'user-1' },
    });

    // Mock document exists in the branch
    mockSupabase.single.mockResolvedValue({ data: { id: 'doc-1', storage_path: 'p' }, error: null });

    await getDocumentSignedUrl('p');

    expect(mockSupabase.from).toHaveBeenCalledWith('documents');
    expect(mockSupabase.eq).toHaveBeenCalledWith('storage_path', 'p');
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId);
  });
});
