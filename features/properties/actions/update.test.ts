import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePropertyStatusAction, updatePropertyAction } from './update';
import { requireAuthContext, isAdmin } from '@/lib/authz';

// Mock dependencies
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAuthenticated: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(null),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../logic/diff', () => ({
  getPropertyDiff: vi.fn(() => ({
    summary: 'Mock Diff',
    details: [],
    oldState: {},
    newState: {}
  })),
}));

vi.mock('../logic/images', () => ({
  finalizeUploadSession: vi.fn().mockResolvedValue(null),
  validatePropertyImagePaths: vi.fn(() => ({ ok: true })),
  PROPERTY_IMAGES_BUCKET: 'property-images',
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: { send: vi.fn().mockResolvedValue({ ids: [] }) },
}));

describe('Property Update Actions - Hardened Security', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';
  const propertyId = '8f27ce8d-0a8a-4d43-a8a4-1e4f2b263828';

  // 🛡️ Localized Mock instance to prevent cross-file pollution
  const mockSupabase: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn(),
    rpc: vi.fn(),
    // CRITICAL: .then() must always resolve to prevent hangs in 'await'
    then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null, count: 0 })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.in.mockReturnValue(mockSupabase);
    
    // Default then implementation
    mockSupabase.then.mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 }));

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: mockUserId, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
      role: 'AGENT',
      tenantId: mockTenantId,
    });
    vi.mocked(isAdmin).mockReturnValue(false);
  });

  describe('updatePropertyStatusAction', () => {
    it('should allow status update when no AI review is required', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: propertyId, status: 'DRAFT', requires_ai_review: false, version: 1 },
        error: null
      });

      mockSupabase.rpc.mockResolvedValue({ data: { id: propertyId }, error: null });

      const result = await updatePropertyStatusAction({ id: propertyId, status: 'ACTIVE', version: 1 });

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_property_status_elite', expect.objectContaining({
        p_status: 'ACTIVE',
        p_is_admin: false
      }));
    });
  });

  describe('updatePropertyAction (Dynamic Update)', () => {
    const mockValues: any = {
      title: 'New Title',
      property_type: 'CONDO',
      listing_type: 'SALE',
      original_price: 1000000,
      price: 1000000,
      commission_sale_percentage: 3,
      address_line1: '123 Sukhumvit',
      province: 'Bangkok',
      district: 'Wathtana',
      subdistrict: 'Khlong Toei',
      google_maps_link: 'https://maps.google.com/test',
      agent_ids: ['a1'],
      feature_ids: ['f1'],
      version: 1,
    };

    it('should allow update if user is the owner and handle relational fetching', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { 
          id: propertyId, 
          created_by: mockUserId, 
          tenant_id: mockTenantId, 
          version: 1, 
          listing_type: 'SALE',
          property_agents: [],
          property_features: []
        },
        error: null
      });
      
      mockSupabase.rpc.mockResolvedValue({ data: { id: propertyId, slug: 'new-slug' }, error: null });

      // Mock sequence for relation fetches in update.ts lines 206-207
      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'a1', full_name: 'Agent' }], error: null }))
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'f1', name: 'Pool' }], error: null }))
        .mockImplementation((resolve: any) => resolve({ data: [], error: null }));

      const result = await updatePropertyAction(propertyId, mockValues, 'session-1');

      if (!result.success) {
        console.error('Action failed unexpectedly:', result.message);
      }

      expect(result.success).toBe(true);
      // Verify isolation in fetch
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should clear requires_ai_review if an ADMIN performs a change', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: 'admin-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as any,
        role: 'ADMIN',
        tenantId: mockTenantId,
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: propertyId, created_by: 'agent-1', tenant_id: mockTenantId, title: 'Old Title', version: 1 },
        error: null
      });
      mockSupabase.rpc.mockResolvedValue({ data: { id: propertyId, slug: 'slug' }, error: null });

      await updatePropertyAction(propertyId, { ...mockValues, title: 'Hardened Edit' }, 'session-1');

      const rpcArgs = mockSupabase.rpc.mock.calls[0][1];
      expect(rpcArgs.p_data.requires_ai_review).toBe(false);
    });
  });
});
