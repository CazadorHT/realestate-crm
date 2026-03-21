"use server";

import { PostgrestError } from "@supabase/supabase-js";
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
  RentalContractInsert,
} from "./schema";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";

export async function getContractByDealId(
  dealId: string,
): Promise<RentalContract | null> {
  try {
    const ctx = await requireAuthContext();
    const { supabase, role } = ctx;
    assertStaff(role);

    // Load contract
    let query = supabase
      .from("rental_contracts")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { data: contracts, error } = await query;

    if (error || !contracts || contracts.length === 0) return null;

    return contracts[0] as RentalContract;
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

    // 3) Create or update
    let data: RentalContract | null = null;
    let error: PostgrestError | null = null;
    let dealIdForAudit = "";

    if (id) {
      // Update - Use partial schema
      const validatedUpdate = updateContractSchema.parse(values);
      // Remove id from update payload to avoid primary key update attempt
      const { id: _id, ...updateData } = validatedUpdate; // Use _id to avoid conflict with function parameter 'id'

      // Try to get deal_id for audit if provided in update
      dealIdForAudit = validatedUpdate.deal_id || "";

      let updateQuery = supabase
        .from("rental_contracts")
        .update(updateData)
        .eq("id", id);

      if (ctx.tenantId && ctx.tenantId !== "ALL") {
        updateQuery = updateQuery.eq("tenant_id", ctx.tenantId);
      }

      const updateRes = await updateQuery.select().single();
      data = updateRes.data;
      error = updateRes.error;

      // If dealId wasn't in update, get it from the result for audit
      if (data && !dealIdForAudit) {
        dealIdForAudit = data.deal_id;
      }
    } else {
      // Create - Use full schema
      const validatedCreate = contractFormSchema.parse(values);
      dealIdForAudit = validatedCreate.deal_id;

      // Check if a contract already exists for this deal to prevent duplicates
      const { data: existingContract } = await (ctx.tenantId && ctx.tenantId !== "ALL"
        ? supabase
            .from("rental_contracts")
            .select("id")
            .eq("deal_id", validatedCreate.deal_id)
            .eq("tenant_id", ctx.tenantId)
        : supabase
            .from("rental_contracts")
            .select("id")
            .eq("deal_id", validatedCreate.deal_id))
        .maybeSingle();

      if (existingContract) {
        return {
          success: false,
          message: "ดีลนี้มีสัญญาอยู่แล้ว กรุณาแก้ไขสัญญาเดิมแทน",
        };
      }

      // Validate deal type and get tenant_id
      // For ADMIN in "ALL Branches" mode, we allow looking up deal without tenantId filter
      // but we MUST use the deal's tenant_id for the contract.
      let dealQuery = supabase
        .from("deals")
        .select("id, deal_type, tenant_id")
        .eq("id", validatedCreate.deal_id);

      if (ctx.tenantId && ctx.tenantId !== "ALL") {
        dealQuery = dealQuery.eq("tenant_id", ctx.tenantId);
      }

      const { data: deal, error: dealErr } = await dealQuery.single();

      if (dealErr || !deal)
        return { success: false, message: "ไม่พบข้อมูลดีลที่ต้องการ" };
      if (!["RENT", "SALE"].includes(deal.deal_type))
        return {
          success: false,
          message: "สามารถสร้างสัญญาได้เฉพาะดีลประเภทเช่าหรือขายเท่านั้น",
        };

      // Create -> auto-generate contract number if not provided
      const toInsert: RentalContractInsert = { 
        ...validatedCreate,
        tenant_id: deal.tenant_id,
        // Ensure start_date and end_date are and remain strings as required by DB
        start_date: validatedCreate.start_date,
        end_date: validatedCreate.end_date,
      } as RentalContractInsert;
      if (!toInsert.contract_number) {
        toInsert.contract_number = `RC-${new Date().getFullYear()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`;
      }

      const insertRes = await supabase
        .from("rental_contracts")
        .insert(toInsert)
        .select()
        .single();

      data = insertRes.data;
      error = insertRes.error;
    }

    if (error || !data) {
      const errMsg = error?.message || "Operation failed";
      // Improve uniqueness error message for duplicate deal
      if (errMsg && /unique/.test(errMsg.toLowerCase())) {
        return {
          success: false,
          message: "ดีลนี้มีสัญญาอยู่แล้ว",
        };
      }
      throw new Error(mapDbError(error));
    }

    // Log audit
    try {
      await logAudit({ supabase, user, role }, {
        action: id ? "rental_contract.update" : "rental_contract.create",
        entity: "rental_contracts",
        entityId: data.id,
        metadata: { dealId: dealIdForAudit },
      });
    } catch (e) {
      // ignore audit errors
    }

    // revalidate deal pages
    revalidatePath(`/protected/deals/${dealIdForAudit}`);
    revalidatePath(`/protected/contracts`);

    return { success: true, data: data };
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

    // Ensure contract exists
    const { data: existing, error: fetchErr } = await (ctx.tenantId &&
    ctx.tenantId !== "ALL"
      ? supabase
          .from("rental_contracts")
          .select("id, deal_id")
          .eq("id", id)
          .eq("tenant_id", ctx.tenantId)
      : supabase.from("rental_contracts").select("id, deal_id").eq("id", id))
      .single();

    if (fetchErr || !existing)
      return { success: false, message: "ไม่พบสัญญาที่ต้องการ" };

    // Delete query
    let deleteQuery = supabase
      .from("rental_contracts")
      .delete()
      .eq("id", id);

    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      deleteQuery = deleteQuery.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await deleteQuery;
    if (error) return { success: false, message: mapDbError(error) };

    await logAudit({ supabase, user, role }, {
      action: "rental_contract.delete",
      entity: "rental_contracts",
      entityId: id,
      metadata: { dealId: existing.deal_id },
    });

    // revalidate deal pages
    revalidatePath(`/protected/deals/${existing.deal_id}`);

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteContractAction error:", err);
    const msg =
      err instanceof Error ? mapDbError(err) : "เกิดข้อผิดพลาดในการลบสัญญา";
    return { success: false, message: msg };
  }
}
