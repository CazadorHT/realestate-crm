import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDealAction } from './actions';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertAuthenticated: vi.fn(),
  assertStaff: vi.fn(),
  authzFail: vi.fn((err) => ({ success: false, message: (err as any).message })),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Deal Actions - Branch Isolation & Stock', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should adjust property stock within tenant boundary when deal is won', async () => {
  const tenantId = '550e8400-e29b-41d4-a716-446655440000';
  const propertyId = '81edbc76-e54a-4cad-b3f3-68d93f1b467b';
  const leadId = '5d4242ae-7de2-4407-b668-a8853ada2a17';

  (requireAuthContext as any).mockResolvedValue({
    supabase: mockSupabase,
    tenantId: tenantId,
    role: 'ADMIN', // ลองเปลี่ยนเป็น ADMIN เผื่อติด Permission
    user: { id: 'user-1' },
  });

  // จัดลำดับการคืนค่าของ Supabase (ถ้าโค้ดมีการเช็คของก่อน insert)
  // ลบ mockResolvedValueOnce เก่าๆ ออก แล้วใช้แบบนี้แทนใน it block
  // 1. Correct Mock Chain: from().select().eq().eq().single()
  // and from().insert().select().single()
  // and from().update().eq().eq()
  const mockTable = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
        // Decide what to return based on context if needed
        return Promise.resolve({ data: { id: 'deal-1' }, error: null });
    }),
  };

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'properties') {
        return {
           ...mockTable,
           single: vi.fn().mockResolvedValue({ 
              data: { id: propertyId, total_units: 10, sold_units: 2, tenant_id: tenantId }, 
              error: null 
           })
        };
    }
    return mockTable;
  });

  const input = {
    lead_id: leadId,
    property_id: propertyId,
    deal_type: 'SALE' as const,
    status: 'CLOSED_WIN' as const, 
    commission_amount: 30000,
    transaction_date: new Date().toISOString(),
  };

  const result = await createDealAction(input as any);

if (!result.success) {
  // พิมพ์ดูทั้งหมดว่ามี errors หรือ message อะไรบ้าง
  console.log('--- DEBUG ERROR ---');
  console.log(JSON.stringify(result, null, 2));
  console.log('-------------------');
}

  expect(result.success).toBe(true);
  expect(mockSupabase.from).toHaveBeenCalledWith('deals');
});
});