import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';
import { getLeadsQuery } from './queries';

vi.mock('@/lib/actions/system-config', () => ({
  getSystemConfig: vi.fn().mockResolvedValue({
    multi_tenant_enabled: true,
    default_tenant_id: 'tenant-1',
  }),
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn((v) => v),
  decrypt: vi.fn((v) => v),
  generateBlindIndex: vi.fn((v) => v),
}));

vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn().mockResolvedValue({
    supabase: mockSupabase,
    user: { id: 'u1' } as any,
    tenantId: 'tenant-1',
    role: 'AGENT',
  }),
  assertStaff: vi.fn(),
  isStaff: vi.fn().mockReturnValue(true),
}));

describe('getLeadsQuery - Unique Customer Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.clear();
  });

  it('should paginate 20 unique customers per page when one customer has repeated contacts', async () => {
    // Generate 35 raw leads in crm_leads_v3:
    // Hunter Patarapol contacted 18 times!
    // And 24 other unique customers contacted 1 time each.
    // Total raw leads: 18 + 24 = 42 leads.
    // Total unique customers: 1 + 24 = 25 customers.
    const rawLeads: any[] = [];

    // Hunter's 18 inquiries
    for (let i = 1; i <= 18; i++) {
      rawLeads.push({
        id: `lead-hunter-${i}`,
        identity_id: 'identity-hunter',
        stage: 'NEW',
        source: 'FACEBOOK',
        tenant_id: 'tenant-1',
        created_at: new Date(2026, 9, 5, 10, i).toISOString(),
        utm_data: {},
        identity: {
          id: 'identity-hunter',
          display_name: 'Hunter Patarapol',
          email: 'hunter@example.com',
          phone: '0812345678',
        },
      });
    }

    // 24 other customers
    for (let i = 1; i <= 24; i++) {
      rawLeads.push({
        id: `lead-other-${i}`,
        identity_id: `identity-other-${i}`,
        stage: 'NEW',
        source: 'WEBSITE',
        tenant_id: 'tenant-1',
        created_at: new Date(2026, 9, 4, 10, i).toISOString(),
        utm_data: {},
        identity: {
          id: `identity-other-${i}`,
          display_name: `Customer ${i}`,
          email: `customer${i}@example.com`,
          phone: `08900000${i.toString().padStart(2, '0')}`,
        },
      });
    }

    // Mock query result for crm_leads_v3
    mockSupabase.mockTableResult('crm_leads_v3', rawLeads);

    // Page 1: pageSize 20
    const resultPage1 = await getLeadsQuery({ page: 1, pageSize: 20 });

    // Page 1 should contain EXACTLY 20 unique customers!
    expect(resultPage1.data).toHaveLength(20);
    // Total count should be 25 unique customers (not 42 raw leads)
    expect(resultPage1.count).toBe(25);

    // Hunter should be in the list with interaction_count = 18
    const hunter = resultPage1.data.find((l) => l.full_name === 'Hunter Patarapol');
    expect(hunter).toBeDefined();
    expect(hunter?.interaction_count).toBe(18);

    // Check page 2
    mockSupabase.mockTableResult('crm_leads_v3', rawLeads);
    const resultPage2 = await getLeadsQuery({ page: 2, pageSize: 20 });

    // Page 2 should contain remaining 5 unique customers
    expect(resultPage2.data).toHaveLength(5);
    expect(resultPage2.count).toBe(25);

    // Hunter should NOT appear on page 2
    const hunterOnPage2 = resultPage2.data.find((l) => l.full_name === 'Hunter Patarapol');
    expect(hunterOnPage2).toBeUndefined();
  });
});
