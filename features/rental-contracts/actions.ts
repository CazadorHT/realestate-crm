"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import {
  contractFormSchema,
  updateContractSchema,
  ContractFormInput,
  UpdateContractInput,
  RentalContract,
} from "./schema";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { generateContractNumber } from "./utils";

import { Database, Json } from "@/lib/database.types.generated";

export async function getContractByDealId(
  dealId: string,
): Promise<RentalContract | null> {
  try {
    const ctx = await requireAuthContext();
    const { supabase, role } = ctx;
    assertStaff(role);

    let query = supabase
      .from("crm_deals_v3")
      .select("id, agent_id, branch_id, closed_at, co_agent_contact, co_agent_name, co_agent_online, commission_total, created_at, created_by, currency, deal_type, lead_id, metadata, net_received, partner_co_broker_id, property_id, source, status, tenant_id, title, total_amount, transaction_date, transaction_end_date, undetermined_date, updated_at, vat_amount, wht_amount")
      .eq("id", dealId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { data: contracts, error } = await query;

    if (error || !contracts || contracts.length === 0) return null;

    const row = contracts[0];
    const meta = (row.metadata as Record<string, Json>) || {};
    const statusVal = row.status === "WON" ? "ACTIVE" : row.status === "TERMINATED" ? "TERMINATED" : "DRAFT";

    return {
      id: row.id,
      deal_id: row.id,
      start_date: row.transaction_date ?? undefined,
      end_date: row.transaction_end_date ?? undefined,
      rent_price: (row.total_amount ?? (meta.rent_price as number)) || undefined,
      deposit_amount: (meta.deposit_amount as number) ?? null,
      lease_term_months: (meta.lease_term_months as number) || undefined,
      payment_cycle: (meta.payment_cycle as string) || undefined,
      other_terms: (meta.other_terms as string) || undefined,
      advance_payment_amount: (meta.advance_payment_amount as number) ?? null,
      status: statusVal,
      contract_number: (meta.contract_number as string) || undefined,
    };
  } catch (err) {
    return null;
  }
}

export async function upsertContractAction(
  id: string | null,
  values: ContractFormInput,
) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, user, role } = ctx;
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    const targetDealId = id || values.deal_id;
    if (!targetDealId) {
      return { success: false, message: "ไม่พบรหัสดีลที่ต้องการบันทึกสัญญา" };
    }

    // Fetch existing deal to merge metadata
    let fetchQuery = supabase.from("crm_deals_v3").select("id, tenant_id, metadata, status, transaction_date, transaction_end_date").eq("id", targetDealId);
    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      fetchQuery = fetchQuery.eq("tenant_id", ctx.tenantId);
    }

    const { data: existingDeal, error: fetchErr } = await fetchQuery.single();
    if (fetchErr || !existingDeal) {
      return { success: false, message: "ไม่พบข้อมูลดีลที่ต้องการ" };
    }

    const currentMeta = (existingDeal.metadata as Record<string, Json>) || {};
    const cNumber = (currentMeta.contract_number as string) || values.contract_number || generateContractNumber();

    const mergedMeta = {
      ...currentMeta,
      contract_number: cNumber,
      rent_price: values.rent_price ?? currentMeta.rent_price,
      deposit_amount: values.deposit_amount ?? currentMeta.deposit_amount,
      advance_payment_amount: values.advance_payment_amount ?? currentMeta.advance_payment_amount,
      lease_term_months: values.lease_term_months ?? currentMeta.lease_term_months,
      payment_cycle: values.payment_cycle ?? currentMeta.payment_cycle,
      other_terms: values.other_terms ?? currentMeta.other_terms,
    };

    const updatePayload: Database["public"]["Tables"]["crm_deals_v3"]["Update"] = {
      metadata: mergedMeta,
      transaction_date: values.start_date ?? existingDeal.transaction_date,
      transaction_end_date: values.end_date ?? existingDeal.transaction_end_date,
      status: values.status === "ACTIVE" ? "WON" : (values.status || existingDeal.status),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("crm_deals_v3")
      .update(updatePayload)
      .eq("id", targetDealId)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(mapDbError(error));
    }

    try {
      await logAudit(
        { supabase, user, role },
        {
          action: id ? "rental_contract.update" : "rental_contract.create",
          entity: "crm_deals_v3",
          entityId: data.id,
          metadata: { dealId: targetDealId },
        },
      );
    } catch (e) {
      // ignore audit errors
    }

    revalidatePath(`/protected/deals/${targetDealId}`);
    revalidatePath(`/protected/contracts`);

    return { success: true, data: { id: data.id, deal_id: targetDealId } };
  } catch (error: unknown) {
    console.error("Upsert Contract Error:", error);
    const msg =
      error instanceof Error
        ? mapDbError(error)
        : "เกิดข้อผิดพลาดในการบันทึกสัญญา";
    return { success: false, message: msg };
  }
}

export async function deleteContractAction(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, user, role } = ctx;
    assertAuthenticated({ userId: user.id, role });
    assertStaff(role);

    let fetchQuery = supabase.from("crm_deals_v3").select("id").eq("id", id);
    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      fetchQuery = fetchQuery.eq("tenant_id", ctx.tenantId);
    }

    const { data: existing, error: fetchErr } = await fetchQuery.single();
    if (fetchErr || !existing) {
      return { success: false, message: "ไม่พบสัญญาที่ต้องการ" };
    }

    const { error } = await supabase
      .from("crm_deals_v3")
      .update({ status: "TERMINATED", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, message: mapDbError(error) };

    await logAudit(
      { supabase, user, role },
      {
        action: "rental_contract.delete",
        entity: "crm_deals_v3",
        entityId: id,
        metadata: { dealId: id },
      },
    );

    revalidatePath(`/protected/deals/${id}`);
    revalidatePath(`/protected/contracts`);

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteContractAction error:", err);
    const msg =
      err instanceof Error ? mapDbError(err) : "เกิดข้อผิดพลาดในการลบสัญญา";
    return { success: false, message: msg };
  }
}
