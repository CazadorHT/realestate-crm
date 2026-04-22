import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  requireAuthContext,
} from './authz';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';
import { getSystemConfig } from '@/lib/actions/system-config';

// 🛡️ Global Mocks are already setup in vitest.setup.ts
// We only need to mock business logic actions
vi.mock('@/lib/actions/system-config', () => ({
  getSystemConfig: vi.fn(),
}));

describe('Authorization Logic (Standardized Infrastructure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.clear();
    
    // Default auth state
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'u1' } }, 
      error: null 
    });
  });

  describe('requireAuthContext', () => {
    it('should throw UNAUTHORIZED if getUser returns null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      await expect(requireAuthContext(undefined, mockSupabase)).rejects.toThrow('Unauthorized');
    });

    it('should resolve AuthContext for valid staff profile', async () => {
      // 1. Profile role fetch
      mockSupabase.mockTableResult('profiles', { role: 'AGENT' });
      
      vi.mocked(getSystemConfig).mockResolvedValue({ 
        multi_tenant_enabled: false, 
        default_tenant_id: 't-default' 
      } as any);

      const ctx = await requireAuthContext(undefined, mockSupabase);
      expect(ctx.user.id).toBe('u1');
      expect(ctx.role).toBe('AGENT');
      expect(ctx.tenantId).toBe('t-default');
    });

    it('should enforce multi-tenant membership for non-staff', async () => {
       mockSupabase.mockTableResult('profiles', { role: 'USER' });
       vi.mocked(getSystemConfig).mockResolvedValue({ multi_tenant_enabled: true } as any);
       
       // Membership lookup
       mockSupabase.mockTableResult('tenant_members', { role: 'MEMBER' });

       const ctx = await requireAuthContext('t1', mockSupabase);
       expect(ctx.tenantId).toBe('t1');
       expect(mockSupabase.from).toHaveBeenCalledWith('tenant_members');
    });
  });
});
