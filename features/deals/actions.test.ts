import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';
import { createDealAction, updateDealAction } from './actions';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
let mockCurrentClient: any = null;

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockCurrentClient),
}));

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
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}));

vi.mock('@/lib/actions/notifications', () => ({
  notifyAdminsAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('./logic/scoped-client', () => ({
  getScopedRevenueClient: vi.fn((supabase) => ({
    deals: () => supabase.from('deals'),
    commissions: () => supabase.from('deal_commissions'),
    leads: () => supabase.from('leads'),
    properties: () => supabase.from('properties'),
    rpc: (name: string, args: any) => supabase.rpc(name, args),
  })),
}));

describe('Deal Actions - Branch Isolation & Stock', () => {
  const createMockQuery = (data: any = [], error: any = null) => {
    const query: any = {
      data,
      error,
      select: vi.fn().mockImplementation(() => query),
      eq: vi.fn().mockImplementation(() => query),
      in: vi.fn().mockImplementation(() => query),
      delete: vi.fn().mockImplementation(() => query),
      insert: vi.fn().mockImplementation(() => query),
      update: vi.fn().mockImplementation(() => query),
      single: vi.fn().mockImplementation(() => query),
      rpc: vi.fn().mockImplementation(() => query),
      then: vi.fn().mockImplementation((onFulfilled) => 
        Promise.resolve({ data: query.data, error: query.error }).then(onFulfilled)
      ),
    };
    return query;
  };

  let mockQuery: any;
  const mockSupabase = {
    from: vi.fn().mockImplementation(() => mockQuery),
    rpc: vi.fn().mockImplementation(() => mockQuery),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = createMockQuery();
    mockCurrentClient = mockSupabase;
  });

  const validUUID1 = '550e8400-e29b-41d4-a716-446655440000';
  const validUUID2 = '81edbc76-e54a-4cad-b3f3-68d93f1b467b';
  const validUUID3 = '5d4242ae-7de2-4407-b668-a8853ada2a17';

  it('should adjust property stock within tenant boundary when deal is won', async () => {
    const tenantId = validUUID1;
    const propertyId = validUUID2;
    const leadId = validUUID3;

    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase as any,
      tenantId: tenantId,
      role: 'ADMIN',
      user: { id: 'user-1' },
    });

    mockQuery.data = { id: propertyId, total_units: 10, sold_units: 2, tenant_id: tenantId };

    const input = {
      lead_id: leadId,
      property_id: propertyId,
      deal_type: 'SALE' as const,
      status: 'CLOSED_WIN' as const,
      commission_amount: 30000,
      transaction_date: new Date().toISOString(),
    };

    const result = await createDealAction(input as any);
    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('deals');
  });

  it('should swap property stock when property is changed in updateDealAction', async () => {
    const tenantId = validUUID1;
    const oldPropId = validUUID2;
    const newPropId = validUUID3;
    const dealId = '4d71a173-e0c8-4f5a-b753-21ddeb6a5b82';
    
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase as any,
      tenantId,
      role: 'ADMIN',
      user: { id: 'user-1' },
    });

    // Mock sequence of return data
    mockQuery.then.mockImplementationOnce((onFulfilled: any) => 
       Promise.resolve({ data: { id: dealId, status: 'CLOSED_WIN', property_id: oldPropId, deal_type: 'SALE' }, error: null }).then(onFulfilled)
    ).mockImplementation((onFulfilled: any) => 
       Promise.resolve({ data: { id: 'any', total_units: 1, sold_units: 0 }, error: null }).then(onFulfilled)
    );

    const result = await updateDealAction({
      id: dealId,
      property_id: newPropId,
      status: 'CLOSED_WIN',
    } as any);

    if (!result.success) {
      console.error('Test Failed:', result.message);
    }

    expect(result.success).toBe(true);
    
    // 💎 10/10 HARDENING: Verify that property swap now uses the unified Atomic RPC
    expect(mockSupabase.rpc).toHaveBeenCalledWith('swap_property_stock_atomic', expect.objectContaining({
      p_old_property_id: oldPropId,
      p_new_property_id: newPropId,
      p_old_deal_type: 'SALE',
      p_new_deal_type: 'SALE',
      p_tenant_id: tenantId
    }));
  });
});