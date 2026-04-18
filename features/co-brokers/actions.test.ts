import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';

describe('Co-Brokers Module - Definitive Case', () => {
  let createCoBrokerAction: any;
  let permanentlyDeleteCoBrokerAction: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock('@/lib/actions/system-config', () => ({
      getSystemConfig: vi.fn().mockResolvedValue({ 
        multi_tenant_enabled: true, 
        default_tenant_id: 'tenant-1' 
      }),
    }));

    vi.doMock('next/cache', () => ({
      revalidatePath: vi.fn(),
    }));

    vi.doMock('@/features/audit/actions', () => ({
       logActivityAction: vi.fn().mockResolvedValue({ success: true }),
    }));

    // 🛡️ RE-IMPORT Actions to respect the mocks
    const actions = await import('./actions');
    createCoBrokerAction = actions.createCoBrokerAction;
    permanentlyDeleteCoBrokerAction = actions.permanentlyDeleteCoBrokerAction;

    // Default User Setup
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'u1' } }, 
      error: null 
    });
  });

  it('should successfully create co-broker', async () => {
    // 1. Role Check
    mockSupabase.mockTableResult('profiles', { role: 'AGENT' });
    // 2. Insert Result
    mockSupabase.mockTableResult('co_brokers', { id: 'cb1', name: 'Test' });

    const result = await createCoBrokerAction({
      name: 'Test Broker',
      phone: '0812345678',
      type: 'INDIVIDUAL',
    } as any);

    if (!result.success) console.error("Create Failed:", result.error);
    expect(result.success).toBe(true);
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  describe('permanentlyDeleteCoBrokerAction', () => {
    it('should allow admin users to delete', async () => {
      // 1. Role Check
      mockSupabase.mockTableResult('profiles', { role: 'ADMIN' });
      // 2. Success Delete
      mockSupabase.mockSuccess([]);

      const result = await permanentlyDeleteCoBrokerAction('cb1');

      if (!result.success) console.error("Delete Failed:", result.error);
      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should block non-admin users', async () => {
      // 1. Role Check
      mockSupabase.mockTableResult('profiles', { role: 'AGENT' });

      const result = await permanentlyDeleteCoBrokerAction('cb1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('สิทธิ์'); // Thai text for "permission"
    });
  });
});
