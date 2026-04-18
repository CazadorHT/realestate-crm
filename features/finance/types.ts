import { Database } from "@/lib/database.types";

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

export interface CommissionPayoutRecord {
  id: string;
  deal_id: string;
  agent_id: string | null;
  agent_name: string | null;
  role: CommissionRole;
  amount: number;
  wht_amount: number;
  net_amount: number;
  status: CommissionStatus;
  slip_url: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  property_title?: string;
  lead_name?: string;
  adjustments?: CommissionAdjustment[];
  total_adjustments?: number;
  net_transfer_amount?: number;
}

export interface CommissionAuditRecord {
  id: string;
  action: string;
  summary: string;
  created_at: string;
  user_full_name: string | null;
  metadata: any;
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
