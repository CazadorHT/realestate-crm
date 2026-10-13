import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
const revalidatePathMock = vi.fn();
const revalidateTagMock = vi.fn();
const purgeCloudflareCacheMock = vi.fn().mockResolvedValue({ success: true });

vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
  revalidateTag: (...args: any[]) => revalidateTagMock(...args),
}));

vi.mock('@/lib/cloudflare', () => ({
  purgeCloudflareCache: (...args: any[]) => purgeCloudflareCacheMock(...args),
}));

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

import { createPropertyAction } from './create';
import { requireAuthContext } from '@/lib/authz';

describe('Multilingual Property Cache Revalidation Test', () => {
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
    total_units: 1,
    sold_units: 0,
    currency: 'THB',
    near_transit: false,
    is_co_agent: false,
    verified: false,
    is_pet_friendly: false,
    is_foreigner_quota: false,
    allow_smoking: false,
    allow_airbnb: false,
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
    requires_ai_review: false,
    has_nearby_places: false,
    has_large_kitchen: false,
    has_western_kitchen: false,
    has_separate_thai_kitchen: false,
    has_bar_counter: false,
    has_bathtub: false,
    has_walk_in_closet: false,
    has_private_garden: false,
    has_garage: false,
    has_bbq_area: false,
    has_home_theatre: false,
    has_private_gym: false,
    has_wine_cellar: false,
    status: 'ACTIVE',
    ...overrides,
  });

  it('should revalidate multilingual routes (/en/properties, /zh/properties, /ru/properties) when creating property', async () => {
    const localSupabase: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'prop-multi-1' }, error: null })
        }),
        then: (resolve: any) => resolve({ data: { id: 'prop-multi-1' }, error: null })
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    (requireAuthContext as any).mockResolvedValue({
      supabase: localSupabase,
      user: { id: 'admin-1' },
      role: 'ADMIN',
      tenantId: 'tenant-1',
    });

    const result = await createPropertyAction(getValidFormData() as any, 'session-test');
    if (!result.success) {
      console.log('createPropertyAction failed with:', result);
    }
    expect(result.success).toBe(true);

    const revalidatedPaths = revalidatePathMock.mock.calls.map(c => c[0]);
    console.log('Currently revalidated paths:', revalidatedPaths);

    // Verify all language variations of /properties are revalidated
    expect(revalidatedPaths).toContain('/properties');
    expect(revalidatedPaths).toContain('/en/properties');
    expect(revalidatedPaths).toContain('/zh/properties');
    expect(revalidatedPaths).toContain('/ru/properties');

    // Verify all language variations of root homepage are revalidated
    expect(revalidatedPaths).toContain('/');
    expect(revalidatedPaths).toContain('/en');
    expect(revalidatedPaths).toContain('/zh');
    expect(revalidatedPaths).toContain('/ru');

    // Verify Cloudflare cache purge includes all language variations
    const purgedUrls = purgeCloudflareCacheMock.mock.calls.flatMap(c => c[0]);
    console.log('Currently purged Cloudflare paths:', purgedUrls);

    expect(purgedUrls).toContain('/properties');
    expect(purgedUrls).toContain('/en/properties');
    expect(purgedUrls).toContain('/zh/properties');
    expect(purgedUrls).toContain('/ru/properties');

    expect(purgedUrls).toContain('/');
    expect(purgedUrls).toContain('/en');
    expect(purgedUrls).toContain('/zh');
    expect(purgedUrls).toContain('/ru');
  });

  it('should purge multilingual category paths and property slug for all locales', async () => {
    const { revalidatePropertyPublicCache } = await import('./revalidate-property-cache');

    await revalidatePropertyPublicCache({ slug: 'exclusive-penthouse' });

    const revalidatedPaths = revalidatePathMock.mock.calls.map(c => c[0]);
    expect(revalidatedPaths).toContain('/properties/exclusive-penthouse');
    expect(revalidatedPaths).toContain('/en/properties/exclusive-penthouse');
    expect(revalidatedPaths).toContain('/zh/properties/exclusive-penthouse');
    expect(revalidatedPaths).toContain('/ru/properties/exclusive-penthouse');

    expect(revalidatedPaths).toContain('/properties/prime-cbd');
    expect(revalidatedPaths).toContain('/en/properties/prime-cbd');
    expect(revalidatedPaths).toContain('/zh/properties/prime-cbd');
    expect(revalidatedPaths).toContain('/ru/properties/prime-cbd');

    const purgedUrls = purgeCloudflareCacheMock.mock.calls.flatMap(c => c[0]);
    expect(purgedUrls).toContain('/properties/exclusive-penthouse');
    expect(purgedUrls).toContain('/en/properties/exclusive-penthouse');
    expect(purgedUrls).toContain('/zh/properties/exclusive-penthouse');
    expect(purgedUrls).toContain('/ru/properties/exclusive-penthouse');
  });
});
