import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  bulkMarkAsReadyToPayAction, 
  markAsPaidAction,
  createCommissionAdjustmentAction,
  getPayoutQueueAction
} from './actions';
import { requireAuthContext } from '@/lib/authz';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

// 1. Universal Supabase Mock
const mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  then: vi.fn().mockImplementation(function(this: any, resolve) {
    return resolve({ data: null, error: null });
  }),
};

// 2. Mock external dependencies
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

describe('Finance Actions - Agile Payout Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.then.mockImplementation((resolve: any) => resolve({ data: {}, error: null }));
  });

  describe('bulkMarkAsReadyToPayAction', () => {
    it('should call high-performance RPC and return success', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'u1' },
        tenantId: 't1',
        role: 'ADMIN',
      });

      mockSupabase.then.mockImplementationOnce((resolve: any) => 
        resolve({ data: { full_name: 'Accountant Pro' }, error: null })
      );

      mockSupabase.then.mockImplementationOnce((resolve: any) => 
        resolve({ data: { updated_count: 5 }, error: null })
      );

      const ids = ['c1', 'c2', 'c3'];
      const result = await bulkMarkAsReadyToPayAction(ids);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'bulk_mark_commissions_as_ready_to_pay',
        expect.objectContaining({
          p_commission_ids: ids,
          p_user_full_name: 'Accountant Pro'
        })
      );
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(5);
    });
  });

  describe('markAsPaidAction', () => {
    it('should calculate net amount correctly and record audit with Thai summary', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'u1' },
        tenantId: 't1',
        role: 'ADMIN',
      });

      const mockCommission = {
        id: 'c1',
        amount: 10000,
        wht_amount: 300,
        adjustments: [{ amount: -500 }, { amount: 1000 }] 
      };

      mockSupabase.then.mockImplementationOnce((resolve: any) => 
        resolve({ data: mockCommission, error: null })
      );
      
      mockSupabase.then.mockImplementationOnce((resolve: any) => 
        resolve({ data: { ...mockCommission, status: 'PAID' }, error: null })
      );

      const result = await markAsPaidAction('c1', {
        payment_reference: 'REF123',
        slip_url: 'https://cdn/slip.jpg'
      });

      expect(result.success).toBe(true);
      
      // ✅ Verify Thai Localization in Audit
      expect(logAudit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          summary: expect.stringContaining('ยืนยันการโอนเงินสุทธิ'),
          action: 'finance.commission_paid'
        })
      );

      // ✅ Fix: Verify via Payout Metadata (Matches your real implementation)
      // โค้ดจริงของคุณเก็บไว้ใน Metadata Snapshot เพื่อความปลอดภัย
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'PAID',
        payment_reference: 'REF123',
        payout_metadata: expect.objectContaining({
          calculation_snapshot: expect.objectContaining({
            final_net: 10200 // ยอดสุทธิ 10,000 - 300 - 500 + 1000
          })
        })
      }));
    });
  });

  describe('createCommissionAdjustmentAction', () => {
    it('should validate adjustment input and record trail', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'u1' },
        tenantId: 't1',
        role: 'ACCOUNTANT',
      });

      mockSupabase.then.mockImplementationOnce((resolve: any) => 
        resolve({ data: { id: 'c1', amount: 5000 }, error: null })
      );

      const result = await createCommissionAdjustmentAction({
        commission_id: 'c1',
        description: 'ค่าธรรมเนียมพิเศษ',
        amount: -25,
        adjustment_type: 'FEE'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        description: 'ค่าธรรมเนียมพิเศษ',
        amount: -25
      }));
    });
  });

  describe('getPayoutQueueAction - Pagination Hardening', () => {
    it('should apply range based on page and pageSize', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: 't1',
        role: 'ADMIN',
      });

      mockSupabase.then.mockImplementationOnce((resolve: any) => 
        resolve({ data: [], error: null, count: 100 })
      );

      const result = await getPayoutQueueAction({ page: 2, pageSize: 20 });

      // ✅ Verify Range Calculation: Page 2 with Size 20 should be index 20 to 39
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39);
      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(100);
      expect(result.page).toBe(2);
    });

    it('should default to page 1 and size 20 if not provided', async () => {
        (requireAuthContext as any).mockResolvedValue({
          supabase: mockSupabase,
          tenantId: 't1',
          role: 'ADMIN',
        });
  
        mockSupabase.then.mockImplementationOnce((resolve: any) => 
          resolve({ data: [], error: null, count: 50 })
        );
  
        await getPayoutQueueAction();
  
        expect(mockSupabase.range).toHaveBeenCalledWith(0, 19);
      });
  });
});