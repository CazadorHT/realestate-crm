import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeamsAction, createTeamAction } from './teamActions';
import { requireAuthContext } from '@/lib/authz';

// Mock the modules
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Team Actions - Branch Isolation', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter teams by tenant_id when not a Super Admin', async () => {
    const tenantId = 'tenant-123';
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: tenantId,
      role: 'ADMIN',
      user: { id: 'user-1' },
    });

    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    await getTeamsAction();

    expect(mockSupabase.from).toHaveBeenCalledWith('teams');
    expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId);
  });

  it('should NOT filter teams by tenant_id when Super Admin (ALL branches)', async () => {
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: 'ALL',
      role: 'ADMIN',
      user: { id: 'user-1' },
    });

    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    await getTeamsAction();

    expect(mockSupabase.from).toHaveBeenCalledWith('teams');
    // tenant_id filter should not be called
    const eqCalls = mockSupabase.eq.mock.calls;
    const hasTenantFilter = eqCalls.some(call => call[0] === 'tenant_id');
    expect(hasTenantFilter).toBe(false);
  });

  it('should assign tenant_id automatically during team creation', async () => {
    const tenantId = 'tenant-123';
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      tenantId: tenantId,
      role: 'ADMIN',
      user: { id: 'user-1' },
    });

    mockSupabase.maybeSingle.mockResolvedValue({ data: null }); // No duplicate name
    mockSupabase.single.mockResolvedValue({ data: { id: 'team-1' }, error: null });

    await createTeamAction('Sales Team');

    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Sales Team',
      tenant_id: tenantId,
    }));
  });
});
