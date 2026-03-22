import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPropertyAction } from './create';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  authzFail: vi.fn((err) => ({ success: false, message: err.message })),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../logic/seo', () => ({
  generateKeywords: vi.fn(() => []),
  prepareSEOData: vi.fn(() => ({ slug: 'test-slug' })),
}));

describe('Property Actions - Branch Isolation & Rollback', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should rollback property creation within tenant boundary if images fail', async () => {
    const tenantId = 'tenant-123';
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: tenantId,
      role: 'AGENT',
      user: { id: 'user-1' },
    });

    // 1. Mock Property Insertion Success (Chain: from.insert.select.single)
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'prop-1' }, error: null });
    
    // 2. Mock Image Insertion Failure
    // First insert (properties) returns mockSupabase for chaining .select().single()
    // Second insert (images) returns the error object directly
    mockSupabase.insert
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ error: { message: 'Image DB Error' } });

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
      images: ['properties/img1.jpg'],
    };

    const result = await createPropertyAction(values as any, 'session-123');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to attach images');

    // 3. Verify Rollback was tenant-scoped
    expect(mockSupabase.from).toHaveBeenCalledWith('properties');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'prop-1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId);
  });
});
