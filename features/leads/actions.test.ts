import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';

import { createLeadAction, updateLeadStageAction } from './actions';

// 🛡️ TOP-LEVEL MOCKS
vi.mock('@/lib/actions/system-config', () => ({
  getSystemConfig: vi.fn().mockResolvedValue({ 
    multi_tenant_enabled: true, 
    default_tenant_id: 'tenant-1' 
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn((v) => v),
  decrypt: vi.fn((v) => v),
  generateBlindIndex: vi.fn((v) => v),
}));

vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn().mockResolvedValue({
    supabase: mockSupabase,
    user: { id: 'u1' },
    tenantId: 'tenant-1',
    role: 'AGENT',
  }),
  AuthzError: class AuthzError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
  isStaff: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/actions/notifications', () => ({
  notifyAdminsAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Leads Module - Definitive Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.clear();
  });

  it('should successfully insert lead (Valid Enum Values)', async () => {
    mockSupabase.mockTableResult('leads', { id: '550e8400-e29b-41d4-a716-446655440001' });

    // 🛡️ Using valid enum value 'WEBSITE' instead of 'DIRECT'
    const result = await createLeadAction({
      full_name: 'Validated Lead',
      phone: '0811112222',
      email: 'valid@test.com',
      source: 'WEBSITE',
      stage: 'NEW',
    } as any);

    if (!result.success) {
      console.error("DEBUG: Create failed with error:", result.error);
    }
    expect(result.success).toBe(true);
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  it('should include tenant isolation in update', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440002';
    mockSupabase.mockTableResult('leads', { id: validId });

    const result = await updateLeadStageAction({ id: validId, stage: 'FOLLOW_UP' });

    if (!result.success) console.error("Update Failed:", result.error);
    expect(result.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
  });
});
