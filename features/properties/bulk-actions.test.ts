import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  bulkDeletePropertiesAction, 
  bulkPermanentDeletePropertiesAction,
  bulkRestorePropertiesAction
} from './bulk-actions';
import { requireAuthContext } from '@/lib/authz';

// 1. Mock Core Dependencies
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));

vi.mock('next/cache', () => ({ 
  revalidatePath: vi.fn(), 
  revalidateTag: vi.fn(),
}));

// 2. Mock 3rd Party & Internal Logic
vi.mock('@/lib/inngest/client', () => ({
  inngest: { send: vi.fn().mockResolvedValue({}) },
}));

vi.mock('@/lib/actions/notifications', () => ({
  notifyAdminsAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('./labels', () => ({
  getStatusFromDb: vi.fn((val) => val), // ให้ return ค่าเดิมกลับไปตรงๆ
  PROPERTY_STATUS_DB_VALUE: { ACTIVE: 'ACTIVE', SOLD: 'SOLD', RENTED: 'RENTED' }
}));

vi.mock('./logic/images', () => ({
  PROPERTY_IMAGES_BUCKET: 'property-images-test'
}));

vi.mock('@/lib/db-error', () => ({
  mapDbError: vi.fn((e) => e.message || "DB_ERROR")
}));

describe('Property Bulk Actions - Isolated & Hardened', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // สร้าง Supabase Mock Builder
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue({ error: null, count: 1 }),
      then: vi.fn(), // จะถูก Override แบบเจาะจงในแต่ละเทส
    };
  });

  describe('bulkDeletePropertiesAction', () => {
    it('should filter out restricted statuses and only soft-delete safe properties', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'u1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      // จำลองการ Await 2 รอบ ในโค้ดคือ statusQuery แล้วก็ dealsQuery
      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: [
            { id: 'p1', status: 'ACTIVE', created_by: 'u1' }, // ✅ ปลอดภัย (เป็นของตัวเอง)
            { id: 'p2', status: 'SOLD', created_by: 'u1' },   // ❌ บล็อก (ขายแล้ว)
            { id: 'p3', status: 'ACTIVE', created_by: 'u1' }  // ❌ บล็อก (จะให้ติด Deal ใน query ถัดไป)
          ] 
        }))
        .mockImplementationOnce((resolve: any) => resolve({ 
          data: [{ property_id: 'p3' }] // p3 ติด Deal
        }));
      
      const result = await bulkDeletePropertiesAction(['p1', 'p2', 'p3']);

      expect(result.success).toBe(true);
      // ควรจะเหลือแค่ p1 ที่ส่งไป RPC bulk_trash_properties
      expect(mockSupabase.rpc).toHaveBeenCalledWith('bulk_trash_properties', {
        p_ids: ['p1']
      });
    });
  });

  describe('bulkPermanentDeletePropertiesAction', () => {
    it('should verify ownership and trigger storage cleanup for safe properties', async () => {
      const { inngest } = await import('@/lib/inngest/client');
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'u1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      // จำลองการ Await 4 รอบ (Verify -> Status -> Deals -> Images)
      mockSupabase.then
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'p1' }] }))
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: 'p1', status: 'ACTIVE' }] }))
        .mockImplementationOnce((resolve: any) => resolve({ data: [] })) // ไม่มี Deal
        .mockImplementationOnce((resolve: any) => resolve({ data: [{ storage_path: 'img.jpg' }] }));
      
      const result = await bulkPermanentDeletePropertiesAction(['p1']);

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('bulk_hard_delete_properties', {
        p_ids: ['p1']
      });
      expect(inngest.send).toHaveBeenCalledWith(expect.objectContaining({
        name: 'storage.cleanup.requested',
        data: expect.objectContaining({ paths: ['img.jpg'] })
      }));
    });
  });

  describe('bulkRestorePropertiesAction', () => {
    it('should enforce tenant isolation during bulk restore', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'u1' },
        role: 'AGENT',
        tenantId: 't1',
      });

      // กู้คืนมี Await แค่ครั้งเดียว
      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ count: 1, error: null }));

      const result = await bulkRestorePropertiesAction(['p1']);

      expect(result.success).toBe(true);
      // ต้องมีการบังคับเช็ค tenant_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 't1');
    });
  });
});