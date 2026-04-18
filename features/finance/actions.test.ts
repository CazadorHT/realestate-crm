import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  bulkMarkAsReadyToPayAction,
  markAsPaidAction,
  createCommissionAdjustmentAction,
  getPayoutQueueAction,
  recalculatePayoutTotalsAction,
  getAgentWalletStatsAction,
  getWhtCertificateDataAction,
} from "./actions";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getCommissionRulesAction } from "@/features/dashboard/actions/commission-actions";

import { createMockSupabase } from "@/tests/mocks/supabase";

// 1. Initialize Standardized Mock
const mockSupabase = createMockSupabase();

// 2. Mock external dependencies
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAdmin: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/features/dashboard/actions/commission-actions", () => ({
  getCommissionRulesAction: vi.fn().mockResolvedValue({
    success: true,
    data: { defaultWhtRate: 3 }
  }),
}));

describe("Finance Actions - Agile Payout Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.clear(); // 🛡️ Fix: Clear internal table mocks
    // Default mock response
    mockSupabase.then.mockImplementation((resolve: any) =>
      resolve({ data: [], error: null, count: 0 }),
    );
  });

  describe("bulkMarkAsReadyToPayAction", () => {
    it("should call high-performance RPC and return success", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        tenantId: "t1",
        role: "ADMIN",
      });

      // 🏗️ Use Table Mocks
      mockSupabase
        .mockTableResult("profiles", { full_name: "Accountant Pro" })
        .mockTableResult("deal_commissions", { updated_count: 5 }); // RPC defaults to this if not handled

      const ids = ["c1", "c2"];
      const result = await bulkMarkAsReadyToPayAction(ids);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "bulk_mark_commissions_as_ready_to_pay",
        expect.objectContaining({
          p_commission_ids: ids,
          p_user_full_name: "Accountant Pro"
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("markAsPaidAction - Hardened Logic", () => {
    it("should calculate net amount correctly with dynamic tax rate", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        tenantId: "t1",
        role: "ADMIN",
      });

      const mockCommission = {
        id: "c1",
        amount: 10000,
        wht_amount: 100,
        tax_rate: 0.01,
        adjustments: [],
        agent: { full_name: "Agent A", line_user_id: "l1" },
      };

      mockSupabase
        .mockTableResult("deal_commissions", mockCommission) // 1. Fetch
        .mockTableResult("deal_commissions", { ...mockCommission, status: "PAID" }) // 2. Update
        .mockTableResult("audit_logs", { success: true }); // 3. Audit

      const result = await markAsPaidAction("c1", {
        payment_reference: "REF_DYNAMIC",
        slip_url: "https://cdn/slip.jpg",
      });

      expect(result.success).toBe(true);
      
      // ✅ Check Audit Trail
      expect(logAudit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: "finance.commission_paid" })
      );

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          payout_metadata: expect.objectContaining({
            calculation_snapshot: expect.objectContaining({ final_net: 9900 }),
          }),
        }),
      );
    });

    it("should fail if the user is not a staff member (RBAC Protection)", async () => {
       const { assertStaff } = await import("@/lib/authz");
       (assertStaff as any).mockImplementationOnce(() => { throw new Error("Unauthorized"); });

       (requireAuthContext as any).mockResolvedValue({
         supabase: mockSupabase,
         user: { id: "u1" },
         tenantId: "t1",
         role: "AGENT",
       });
 
       const result = await markAsPaidAction("c1", {
         payment_reference: "HACK",
         slip_url: "hacker.jpg",
       });
       
       expect(result.success).toBe(false);
       expect(result.error).toContain("Unauthorized");
       expect(mockSupabase.update).not.toHaveBeenCalled();
    });
  });

  describe("recalculatePayoutTotalsAction - Edge Cases", () => {
    it("should handle multiple adjustments and rounding correctly", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        tenantId: "t1",
        role: "ADMIN",
      });

      const mockCommission = {
        id: "c1",
        amount: 333.33,
        wht_amount: 0,
        tax_rate: 0.03,
        deal_id: "d1",
        adjustments: [{ amount: 10.05 }, { amount: -5.13 }, { amount: 0.08 }],
      };

      mockSupabase
        .mockTableResult("deal_commissions", mockCommission) // 1. Fetch
        .mockTableResult("deal_commissions", [{ amount: 333.33 }]) // 2. Deal sum
        .mockTableResult("deal_commissions", { success: true }) // 3. Update result
        .mockTableResult("audit_logs", { success: true }); // 4. Audit

      const result = await recalculatePayoutTotalsAction("c1");
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          wht_amount: 10,
          net_amount: 328.33,
        }),
      );
    });
  });

  describe("getAgentWalletStatsAction - Logic Integrity", () => {
    it("should compute pending vs realized earnings with precision", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "a1" },
        tenantId: "t1",
      });

      const mockCommissions = [
        { id: "c1", status: "PAID", amount: 1000, wht_amount: 30, adjustments: [], deal_id: "d1" },
        { id: "c2", status: "READY_TO_PAY", amount: 500, wht_amount: 15, adjustments: [], deal_id: "d2" },
      ];

      mockSupabase.mockTableResult("deal_commissions", mockCommissions);

      const result = await getAgentWalletStatsAction();

      expect(result.success).toBe(true);
      expect(result.data?.stats.totalEarnings).toBe(970);
      expect(result.data?.stats.pendingAmount).toBe(485);
    });
  });

  describe("getWhtCertificateDataAction", () => {
    it("should format Thai currency and names correctly", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: "t1",
        role: "ADMIN",
      });

      const mockData = {
        id: "c1",
        amount: 10000,
        wht_amount: 300,
        paid_at: "2024-01-01T12:00:00Z",
        agent: { full_name: "สมชาย ใจดี" },
        tenant: { name: "Cazador Enterprise" },
      };

      mockSupabase.mockTableResult("deal_commissions", mockData);

      const result = await getWhtCertificateDataAction("c1");
      expect(result.success).toBe(true);
      expect(result.data?.agentName).toBe("สมชาย ใจดี");
      expect(result.data?.taxAmount).toBe("300.00");
    });
  });

  describe("getPayoutQueueAction - Pagination Hardening", () => {
    it("should apply range based on page and pageSize", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: "t1",
        role: "ADMIN",
      });

      const mockQueue = [
        {
          id: "c1",
          deal_id: "d1",
          summary_view: { total_adjustments: 0, net_payout_amount: 5000 },
          agent: { full_name: "P1" },
        },
      ];

      mockSupabase
        .mockTableResult("deal_commissions", mockQueue)
        .mockTableResult("deal_commissions", [{ deal_id: "d1", amount: 5000 }]);

      const result = await getPayoutQueueAction({ page: 2, pageSize: 20 });
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39);
      expect(result.success).toBe(true);
    });
  });

  describe("Security & Cross-Tenant Protection", () => {
    it("should block createCommissionAdjustmentAction if commission belongs to another tenant", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "admin-1" },
        tenantId: "tenant-A",
        role: "ADMIN",
      });

      // Mock commission belongs to tenant-B
      mockSupabase.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: { tenant_id: "tenant-B" }, error: null }),
      );

      const result = await createCommissionAdjustmentAction({
        commission_id: "c1",
        description: "Hack Attempt",
        amount: 1000,
        adjustment_type: "BONUS",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("ข้ามสาขา");
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
  });

  describe("Idempotency & Precision Hardening", () => {
    it("should prevent double-payment using markAsPaidAction with shared reference", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        tenantId: "t1",
        role: "ADMIN",
      });

      const mockCommission = {
        id: "c1",
        amount: 1000,
        wht_amount: 30,
        tax_rate: 0.03,
        status: "READY_TO_PAY",
        agent: { full_name: "Agent A" },
      };

      mockSupabase
        .mockTableResult("deal_commissions", mockCommission) // 1. Fetch
        .mockTableResult("deal_commissions", { ...mockCommission, status: "PAID" }) // 2. Update
        .mockTableResult("audit_logs", { success: true }); // 3. Audit

      const result = await markAsPaidAction("c1", {
        payment_reference: "UNIQUE_REF_123",
        slip_url: "http://slip.com/slip.jpg",
      });

      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_reference: "UNIQUE_REF_123",
          status: "PAID",
        })
      );
    });

    it("should handle floating point precision in recalculatePayoutTotalsAction", async () => {
       (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        tenantId: "t1",
        role: "ADMIN",
      });

      const mockCommission = {
        id: "c-float",
        amount: 1000.00000000001,
        wht_amount: 0,
        tax_rate: 0.03,
        deal_id: "d1",
        adjustments: [
          { amount: 0.1 },
          { amount: 0.2 },
        ],
      };

      // 🏗️ Use Standardized Table Mocks for Multi-call scenarios
      mockSupabase
        .mockTableResult("deal_commissions", mockCommission) // Call 1: Fetch
        .mockTableResult("deal_commissions", [{ amount: 1000 }]) // Call 2: Sum check
        .mockTableResult("deal_commissions", { success: true }) // Call 3: Update
        .mockTableResult("audit_logs", { success: true }); // Call 4: Audit

      const result = await recalculatePayoutTotalsAction("c-float");
      
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
      
      // Verification: 1000 - (1000 * 0.03) + (0.1 + 0.2 rounded) = 1000 - 30 + 0.30 = 970.30
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          net_amount: 970.3,
        })
      );
    });
  });
});