import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuthContext } from '@/lib/authz';

// 1. Define mockSupabase at top level so all mocks can reference it
const mockStorage = {
  copy: vi.fn().mockResolvedValue({ data: {}, error: null }),
  remove: vi.fn().mockResolvedValue({ data: [], error: null }),
  upload: vi.fn().mockResolvedValue({ error: null }),
  getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://cdn/p1.webp' } })),
};

const mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
  storage: {
    from: vi.fn().mockReturnValue(mockStorage),
  },
  then: vi.fn().mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 })),
};

// Mock admin client to return our local mockSupabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

// Mock Authz
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/lib/file-validation', () => ({
  validateImageFile: vi.fn(() => Promise.resolve({ valid: true })),
}));

// Mock Sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-webp-buffer')),
  })),
}));

// Now import the actions after mocking
import { uploadPropertyImageAction, deletePropertyImageFromStorage } from './images';

describe('Property Image Actions - Security & Validation', () => {
  const mockUserId = 'user-123';
  const mockSessionId = 'test-session-999';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.gte.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockReturnValue(mockSupabase);
    mockSupabase.then.mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 }));

    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: mockUserId, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'AGENT',
      tenantId: 't1',
    });
  });

  describe('uploadPropertyImageAction', () => {
    const getMockFormData = () => {
      const fd = new FormData();
      fd.append('sessionId', mockSessionId);
      fd.append('file', new File(['dummy'], 'test.jpg', { type: 'image/jpeg' }));
      return fd;
    };

    it('should successfully upload and track the image in TEMP status', async () => {
      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ count: 0, error: null })) // rate limit check
        .mockImplementationOnce((resolve: any) => resolve({ error: null })); // track insert success

      const result = await uploadPropertyImageAction(getMockFormData());

      if ('success' in result && result.success === false) {
        throw new Error('Upload failed: ' + result.message);
      }

      expect(result.path).toContain(mockUserId);
      expect(mockSupabase.from).toHaveBeenCalledWith('property_image_uploads');
    });

    it('should rollback and remove the file if DB tracking fails', async () => {
      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ count: 0, error: null })) // rate limit
        .mockImplementationOnce((resolve: any) => resolve({ error: { message: 'DB Down' } })); // track fail

      const result = await uploadPropertyImageAction(getMockFormData());

      expect(result.success).toBe(false);
      // Verify storage cleanup was called on rollback
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('property-images');
      expect(mockStorage.remove).toHaveBeenCalled();
    });
  });

  describe('deletePropertyImageFromStorage', () => {
    it('should block deletion of files outside the property bucket path', async () => {
      await expect(deletePropertyImageFromStorage('avatars/other.jpg')).rejects.toThrow('Invalid storage path');
    });

    it('should allow deletion of own property images', async () => {
      const validPath = `t1/properties/${mockUserId}/${mockSessionId}/img.webp`;
      mockSupabase.then.mockImplementation((resolve: any) => resolve({ error: null }));

      const result = await deletePropertyImageFromStorage(validPath);

      expect(result.success).toBe(true);
      expect(mockStorage.remove).toHaveBeenCalledWith([validPath]);
    });
  });
});
