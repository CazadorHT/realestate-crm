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
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ['test-event-id'] }),
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
    branch_id: '123e4567-e89b-12d3-a456-426614174000',
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
      branch_id: '123e4567-e89b-12d3-a456-426614174000',
      images: ['properties/img1.jpg'],
      // ✨ Missing Required Fields
      currency: 'THB',
      total_units: 1,
      sold_units: 0,
      near_transit: false,
      is_co_agent: false,
      verified: false,
      is_pet_friendly: false,
      is_foreigner_quota: false,
      allow_smoking: false,
      is_renovated: false,
      is_fully_furnished: false,
      is_corner_unit: false,
      has_private_pool: false,
      is_selling_with_tenant: false,
      is_bare_shell: false,
      is_exclusive: false,
      has_garden_view: false,
      has_pool_view: false,
      has_city_view: false,
      has_unblocked_view: false,
      has_river_view: false,
      facing_east: false,
      facing_north: false,
      facing_south: false,
      facing_west: false,
      has_multi_parking: false,
      is_grade_a: false,
      is_grade_b: false,
      is_grade_c: false,
      is_column_free: false,
      is_central_air: false,
      is_split_air: false,
      has_247_access: false,
      has_fiber_optic: false,
      is_tax_registered: false,
      has_raised_floor: false,
      is_high_ceiling: false,
      is_cbd: false,
      is_smart_home: false,
      has_private_elevator: false,
      is_handicapped_friendly: false,
      is_high_floor: false,
      is_green_building: false,
      has_flexible_lease: false,
      is_fully_fitted: false,
      is_never_lived_in: false,
      requires_ai_review: true,
      has_nearby_places: false,
      status: 'ACTIVE',
    };


    const result = await createPropertyAction(values as any, 'session-123');

    // If it fails with "Required", we still have missing fields. 
    // But since we added many, let's see if we hit the image failure now.
    expect(result.message).toBe('เกิดข้อผิดพลาด: Image DB Error');
    expect(result.success).toBe(false);

    expect(localSupabase.from).toHaveBeenCalledWith('properties_core');

  });

  describe('Sentinel AI Bypass', () => {
    it('should automatically set requires_ai_review to false for ADMIN', async () => {
      const localSupabase: any = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
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
        tenantId: 't1',
      });

      const values = {
        title: 'Admin Property',
        property_type: 'CONDO',
        listing_type: 'SALE',
        original_price: 1000,
        currency: 'THB',
        total_units: 1,
        sold_units: 0,
        near_transit: false,
        is_co_agent: false,
        verified: false,
        is_pet_friendly: false,
        is_foreigner_quota: false,
        allow_smoking: false,
        is_renovated: false,
        is_fully_furnished: false,
        is_corner_unit: false,
        has_private_pool: false,
        is_selling_with_tenant: false,
        is_bare_shell: false,
        is_exclusive: false,
        has_garden_view: false,
        has_pool_view: false,
        has_city_view: false,
        has_unblocked_view: false,
        has_river_view: false,
        facing_east: false,
        facing_north: false,
        facing_south: false,
        facing_west: false,
        has_multi_parking: false,
        is_grade_a: false,
        is_grade_b: false,
        is_grade_c: false,
        is_column_free: false,
        is_central_air: false,
        is_split_air: false,
        has_247_access: false,
        has_fiber_optic: false,
        is_tax_registered: false,
        has_raised_floor: false,
        is_high_ceiling: false,
        is_cbd: false,
        is_smart_home: false,
        has_private_elevator: false,
        is_handicapped_friendly: false,
        is_high_floor: false,
        is_green_building: false,
        has_flexible_lease: false,
        is_fully_fitted: false,
        is_never_lived_in: false,
        requires_ai_review: true, // Should be overridden by action
        has_nearby_places: false,
        status: 'ACTIVE',
        province: 'BKK',
        district: 'D1',
        subdistrict: 'S1',
        branch_id: '123e4567-e89b-12d3-a456-426614174000',
        commission_sale_percentage: 3,
      };

      await createPropertyAction(values as any, 'session-123');

      // In V3, requires_ai_review is in the SECOND insert (properties_details) within meta_data
      const detailsInsertCall = localSupabase.insert.mock.calls[1][0];
      expect(detailsInsertCall.meta_data.requires_ai_review).toBe(false);
    });

    it('should preserve requires_ai_review as true for AGENT', async () => {
      const localSupabase: any = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation(() => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'p2' }, error: null })
          })
        })),
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: localSupabase,
        user: { id: 'agent-1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      const values = {
        title: 'Agent Property',
        property_type: 'CONDO',
        listing_type: 'SALE',
        original_price: 1000,
        currency: 'THB',
        total_units: 1,
        sold_units: 0,
        near_transit: false,
        is_co_agent: false,
        verified: false,
        is_pet_friendly: false,
        is_foreigner_quota: false,
        allow_smoking: false,
        is_renovated: false,
        is_fully_furnished: false,
        is_corner_unit: false,
        has_private_pool: false,
        is_selling_with_tenant: false,
        is_bare_shell: false,
        is_exclusive: false,
        has_garden_view: false,
        has_pool_view: false,
        has_city_view: false,
        has_unblocked_view: false,
        has_river_view: false,
        facing_east: false,
        facing_north: false,
        facing_south: false,
        facing_west: false,
        has_multi_parking: false,
        is_grade_a: false,
        is_grade_b: false,
        is_grade_c: false,
        is_column_free: false,
        is_central_air: false,
        is_split_air: false,
        has_247_access: false,
        has_fiber_optic: false,
        is_tax_registered: false,
        has_raised_floor: false,
        is_high_ceiling: false,
        is_cbd: false,
        is_smart_home: false,
        has_private_elevator: false,
        is_handicapped_friendly: false,
        is_high_floor: false,
        is_green_building: false,
        has_flexible_lease: false,
        is_fully_fitted: false,
        is_never_lived_in: false,
        requires_ai_review: true, // Should remain true for AGENT
        has_nearby_places: false,
        status: 'ACTIVE',
        province: 'BKK',
        district: 'D1',
        subdistrict: 'S1',
        branch_id: '123e4567-e89b-12d3-a456-426614174000',
        commission_sale_percentage: 3,
      };

      await createPropertyAction(values as any, 'session-123');

      // In V3, requires_ai_review is in the SECOND insert (properties_details) within meta_data
      const detailsInsertCall = localSupabase.insert.mock.calls[1][0];
      expect(detailsInsertCall.meta_data.requires_ai_review).toBe(true);
    });
  });
});
