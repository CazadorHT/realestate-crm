import { Database } from "@/lib/database.types.generated";
import { type PropertyImage } from "@/features/properties/types";

export type CommissionStatus = "PENDING" | "READY_TO_PAY" | "PAID" | "CANCELLED";
export type CommissionRole = "AGENT" | "CO_BROKER" | "COMPANY";

// 🚫 CommissionAdjustment has been deprecated in V3 Architecture
// The ledger is now immutable and adjustments are handled as separate ledger entries if necessary.

export interface CommissionPayoutRecord extends JoinedPayout {
  recipient_name?: string;
  is_stale?: boolean;
  expected_total?: number;
  calculated_total?: number;
  total_adjustments?: number;
  net_transfer_amount?: number;
  wht_amount?: number;
  agent?: { full_name?: string | null } | null;
  co_broker?: { name?: string | null } | null;
  slip_url?: string;
  payout_metadata?: {
    calculation_snapshot?: {
      tax_rate_snapshot?: number;
      gross?: number | null;
      wht?: number | null;
      net_base?: number;
      final_net?: number;
    };
  } | null;
  updated_at?: string;
  property?: { title?: string } | null;
  author?: { name?: string } | null;
  audit_meta?: any[] | null;
}

export interface RecalculatePreview {
  before: {
    amount: number;
    wht: number;
    net: number;
    taxRate: number | null;
  };
  after: {
    amount: number;
    wht: number;
    net: number;
    taxRate: number;
  };
  reason: string;
}

export interface CommissionAuditRecord {
  id: string;
  action: string;
  summary: string;
  created_at: string;
  user_full_name: string | null;
  metadata: Record<string, unknown>;
}

export type PayoutStatusUpdateResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export type BulkPayoutResult = {
  success: boolean;
  processedCount: number;
  message?: string;
  error?: string;
};

export interface PaginatedPayoutResult {
  success: boolean;
  data: CommissionPayoutRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  error?: string;
}

export type JoinedPayout = Database["public"]["Tables"]["crm_deal_commissions_v3"]["Row"] & {
  recipient: { id: string; display_name: string; phone: string | null } | null;
  summary_view?: { total_adjustments: number | null; net_payout_amount: number | null } | null;
  deal: {
    id: string;
    commission_total: number | null;
    property: {
      details: { title: any }[] | null;
      property_type: number | null;
      listing_type: number | null;
    } | null;
  } | null;
};

/** 🧬 REFACTORED TYPES TO AVOID INTERFACE EXTENSION ISSUES */
export type AgentWalletHistory = Database["public"]["Tables"]["crm_deal_commissions_v3"]["Row"] & {
  net_amount: number;
  net_transfer_amount?: number;
  wht_amount?: number;
  total_adjustments?: number;
  deal: {
    id: string;
    status: string;
    property: {
      title?: string;
      details?: { title: any }[] | null;
      media?: { url: string; is_cover: boolean | null }[]; 
      listing_type?: number | null;
      property_type?: number | null;
    } | null;
  } | null;
};

export interface AgentWalletStats {
  totalEarnings: number;
  pendingAmount: number;
  closedDealsCount: number;
  totalCommissionsCount: number;
}