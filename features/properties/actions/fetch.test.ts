import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getGlobalPropertiesTableDataAction, 
  getGlobalInventoryFilterCountsAction 
} from './fetch';
import { requireAuthContext } from '@/lib/authz';

// 1. สร้าง Universal Mock ที่รองรับ .range(), .or(), .is(), .order()
const mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  // หัวใจสำคัญ: คืนค่าข้อมูลจำลองเมื่อถูก await
  then: vi.fn().mockImplementation(function(this: any, resolve) {
    return resolve({ data: [], count: 0, error: null });
  }),
};

vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAuthenticated: vi.fn(),
  AuthzError: class AuthzError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message || code);
      this.code = code;
      this.name = 'AuthzError';
    }
  }
}));

describe('Property Actions - Hardened Fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-link chains ให้ครบทุกตัว
    Object.values(mockSupabase).forEach((m: any) => {
      if (m && typeof m.mockReturnThis === 'function') m.mockReturnThis();
    });
    // Default success state
then: vi.fn().mockImplementation((resolve: (value: { data: any; error: any; count?: number }) => void) => 
  resolve({ data: [], error: null, count: 0 })
)  });

  describe('getGlobalPropertiesTableDataAction', () => {
    it('should apply pagination and global filters correctly', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        role: 'ADMIN',
      });

      // จำลองข้อมูลที่มีความสัมพันธ์ (Joined Data)
      const mockData = [{
        id: '1',
        title: 'Luxury Condo',
        price: 5000000,
        status: 'ACTIVE',
        property_type: 'CONDO',
        listing_type: 'SALE',
        created_at: new Date().toISOString(),
        tenants: { name: 'Branch 1' },
        property_images: [{ image_url: 'img1.jpg', is_cover: true }],
        images: [{ url: 'img1.jpg', is_cover: true, sort_order: 0 }],
        main_image_url: 'img1.jpg'
      }];

      mockSupabase.then.mockImplementationOnce((resolve: (arg0: { data: { id: string; title: string; price: number; status: string; property_type: string; listing_type: string; created_at: string; tenants: { name: string; }; property_images: { image_url: string; is_cover: boolean; }[]; }[]; count: number; error: null; }) => any) => 
        resolve({ data: mockData, count: 1, error: null })
      );

      const params = {
        page: 2, // Page 2 => range(10, 19)
        q: 'luxury',
        status: 'ACTIVE',
      };

      const result = await getGlobalPropertiesTableDataAction(params);

      // ✅ ตรวจสอบ Pagination (Page Size 10)
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
      
      // ✅ ตรวจสอบ Global Search (OR Filter)
      expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('luxury'));
      
      // ✅ ตรวจสอบผลลัพธ์การ Mapping
      expect(result.tableData[0].tenant_name).toBe('Branch 1');
      expect(result.tableData[0].main_image_url).toBe('img1.jpg');
    });

    it('should throw error if non-admin tries to access global data', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        role: 'AGENT',
      });

      await expect(getGlobalPropertiesTableDataAction({ page: 1 }))
        .rejects.toThrow('Forbidden: Admin only');
    });
  });

  describe('getGlobalInventoryFilterCountsAction', () => {
    it('should correctly aggregate counts from raw data (In-memory Hardening)', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        role: 'ADMIN',
      });

      const mockData = [
        { property_type: 'CONDO', status: 'ACTIVE', listing_type: 'SALE', tenant_id: 't1' },
        { property_type: 'CONDO', status: 'ACTIVE', listing_type: 'RENT', tenant_id: 't1' },
        { property_type: 'HOUSE', status: 'SOLD', listing_type: 'SALE', tenant_id: 't2' },
        { property_type: 'CONDO', status: 'ACTIVE', listing_type: 'SALE', tenant_id: 't1' },
      ];

      mockSupabase.then.mockImplementationOnce((resolve: (arg0: { data: { property_type: string; status: string; listing_type: string; tenant_id: string; }[]; error: null; }) => any) => 
        resolve({ data: mockData, error: null })
      );

      const counts = await getGlobalInventoryFilterCountsAction();

      // ✅ ตรวจสอบการนับแบบ In-memory (Case Insensitive)
      expect(counts.propertyTypes['CONDO']).toBe(3);
      expect(counts.propertyTypes['HOUSE']).toBe(1);
      expect(counts.statuses['ACTIVE']).toBe(3);
      expect(counts.branches['t1']).toBe(3);
    });
  });
});