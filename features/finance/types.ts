import { Database } from "@/lib/database.types";
import { type PropertyImage } from "@/features/properties/types";

export type CommissionStatus = Database["public"]["Enums"]["commission_status"];
export type CommissionRole = Database["public"]["Enums"]["commission_role"];

export interface CommissionAdjustment {
  id: string;
  commission_id: string;
  description: string;
  amount: number;
  adjustment_type: 'MARKETING' | 'FEE' | 'BONUS' | 'OTHER';
  created_at: string;
}

export interface CommissionPayoutRecord extends JoinedPayout {
  recipient_name?: string;
  is_stale?: boolean;
  expected_total?: number;
  calculated_total?: number;
  total_adjustments?: number;
  net_transfer_amount?: number;
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

export type JoinedPayout = Database["public"]["Tables"]["deal_commissions"]["Row"] & {
  agent: { id: string; full_name: string; phone: string | null } | null;
  co_broker: {
    id: string;
    name: string;
    phone: string | null;
    company_name: string | null;
  } | null;
  adjustments: Database["public"]["Tables"]["commission_adjustments"]["Row"][];
  summary_view: {
    total_adjustments: number | null;
    net_payout_amount: number | null;
  } | null;
  deal: {
    id: string;
    commission_amount: number | null;
    property: {
      title: string | null;
      property_type: string | null;
      listing_type: string | null;
    } | null;
  } | null;
};

/** 🧬 REFACTORED TYPES TO AVOID INTERFACE EXTENSION ISSUES */
export type AgentWalletHistory = Database["public"]["Tables"]["deal_commissions"]["Row"] & {
  net_amount: number;
  adjustments: Database["public"]["Tables"]["commission_adjustments"]["Row"][];
  deal: {
    id: string;
    status: string;
    property: {
      title: string;
      images: PropertyImage[]; 
      listing_type: string;
      property_type: string;
    } | null;
  } | null;
};

export interface AgentWalletStats {
  totalEarnings: number;
  pendingAmount: number;
  closedDealsCount: number;
  totalCommissionsCount: number;
}