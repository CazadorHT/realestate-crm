import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeamsAction, createTeamAction, updateTeamAction, deleteTeamAction } from './teamActions';
import { requireAuthContext } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Team Actions - Enterprise Model', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(), // Added for getTeamManagementStatsAction
    not: vi.fn().mockReturnThis(), // Added for stats
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    then: vi.fn().mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 })),
    // Default success response for 'await query'
    data: [],
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as any).mockReturnValue(mockSupabase);
    (mockSupabase.maybeSingle as any).mockResolvedValue({ data: null, error: null });
    (mockSupabase.single as any).mockResolvedValue({ data: {}, error: null });
    mockSupabase.error = null;
    mockSupabase.data = [];
  });

  describe('getTeamsAction (Admin Scoped)', () => {
    it('should filter teams by tenant_id when not a Super Admin', async () => {
      const tenantId = 'tenant-123';
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: tenantId,
        role: 'ADMIN',
        user: { id: 'user-1' },
      });

      mockSupabase.data = []; // Mock empty list

      const result = await getTeamsAction();

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId);
    });

    it('should NOT filter teams by tenant_id for Super Admin (ALL branches)', async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: 'ALL',
        role: 'ADMIN',
        user: { id: 'user-1' },
      });

      await getTeamsAction();

      const eqCalls = mockSupabase.eq.mock.calls;
      const hasTenantFilter = eqCalls.some(call => call[0] === 'tenant_id');
      expect(hasTenantFilter).toBe(false);
    });
  });

  describe('createTeamAction (Integrity & Audit)', () => {
    const tenantId = 'tenant-123';
    
    beforeEach(() => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: tenantId,
        role: 'ADMIN',
        user: { id: 'user-1' },
      });
    });

    it('should assign tenant_id automatically and log audit', async () => {
      (mockSupabase.maybeSingle as any).mockResolvedValue({ data: null }); // No duplicate name
      (mockSupabase.single as any).mockResolvedValue({ data: { id: 'team-1' }, error: null });

      const result = await createTeamAction('Sales Team');

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Sales Team',
        tenant_id: tenantId,
      }));
      
      expect(logAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        action: 'team.create',
        entity: 'teams',
      }));
      expect(revalidatePath).toHaveBeenCalledWith('/protected/settings/teams');
    });

    it('should check for duplicate team names', async () => {
      (mockSupabase.maybeSingle as any).mockResolvedValue({ data: { id: 'existing-team' } });

      const result = await createTeamAction('Duplicate Team');

      expect(result.success).toBe(false);
      expect(result.message).toContain('ชื่อทีมนี้มีอยู่ในระบบแล้ว');
    });
  });

  describe('updateTeamAction (Security)', () => {
    it('should respect tenant isolation during update', async () => {
      const tenantId = 'tenant-123';
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: tenantId,
        role: 'ADMIN',
        user: { id: 'user-1' },
      });

      (mockSupabase.maybeSingle as any).mockResolvedValue({ data: null }); // No duplicate
      mockSupabase.error = null;

      const result = await updateTeamAction('team-1', { name: 'Updated Name' });

      expect(result.success).toBe(true);
      // Verify specific calls (index may vary, so we check if called with)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'team-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId);
    });
  });

  describe('deleteTeamAction (Cleanup)', () => {
    it('should clear profile team_id and then delete the team', async () => {
      const tenantId = 'tenant-123';
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: tenantId,
        role: 'ADMIN',
        user: { id: 'user-1' },
      });

      mockSupabase.then.mockImplementationOnce((resolve: any) => resolve({ data: null, error: null }));

      const result = await deleteTeamAction('team-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('hard_delete_team', {
        p_team_id: 'team-1'
      });
    });
  });
});
