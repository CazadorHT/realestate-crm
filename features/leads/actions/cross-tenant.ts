"use server";

import { createSafeAction } from "@/lib/actions/safe-action";
import { z } from "zod";

const SearchGlobalLeadSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * Searches for a lead across all tenants to prevent duplicates.
 * Returns masked data to preserve privacy.
 */
export const searchGlobalLeadAction = createSafeAction(
  SearchGlobalLeadSchema,
  async (data, { supabase, userId }) => {
    const { data: result, error } = await supabase.rpc(
      "search_leads_globally",
      {
        search_phone: data.phone || null,
        search_email: data.email || null,
      },
    );

    if (error) {
      console.error("Global search error:", error);
      throw new Error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูลส่วนกลาง");
    }

    // result is an array (from returns table)
    const leadMatch = result?.[0];

    if (!leadMatch || !leadMatch.found) {
      return { found: false };
    }

    return {
      found: true,
      branchName: leadMatch.branch_name,
      agentName: leadMatch.assigned_agent_name,
      maskedName: leadMatch.masked_name,
    };
  },
);

/**
 * Initiates a lead transfer to another branch.
 */
const TransferLeadSchema = z.object({
  leadId: z.string().uuid(),
  targetTenantId: z.string().uuid(),
  note: z.string().optional(),
});

export const requestLeadTransferAction = createSafeAction(
  TransferLeadSchema,
  async (data, { supabase, userId, tenantId }) => {
    // 1. Create the transfer record
    const { data: transfer, error } = await supabase
      .from("lead_transfers")
      .insert({
        lead_id: data.leadId,
        from_tenant_id: tenantId,
        to_tenant_id: data.targetTenantId,
        requested_by: userId,
        note: data.note,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, transferId: transfer.id };
  },
);
