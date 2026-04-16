"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { getSystemConfig } from "@/lib/actions/system-config";
import { z } from "zod";

const ownerSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อเจ้าของ"),
  phone: z
    .string()
    .refine(
      (val) => !val || /^0[0-9]{8,9}$/.test(val.replace(/[- ]/g, "")),
      "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)",
    )
    .nullable()
    .optional(),
  line_id: z.string().nullable().optional(),
  facebook_url: z.string().nullable().optional(),
  other_contact: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  owner_type: z.string().nullable().optional(),
});

const updateOwnerSchema = ownerSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateOwnerInput = z.infer<typeof ownerSchema>;
export type UpdateOwnerInput = z.infer<typeof updateOwnerSchema>;

import { calculatePropertyCounts } from "./logic";

export async function getOwnersAction(allBranches = false) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    let query = ctx.supabase.from("owners").select("*").order("full_name");

    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;

    if (!isMultiTenant) {
      // Single-tenant: show all
    } else if (allBranches && ctx.role === "ADMIN") {
      // Admin + allBranches: show all
    } else if (ctx.tenantId && ctx.tenantId !== "ALL") {
      query = query.or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`);
    } else if (isMultiTenant && !allBranches) {
      // Defensive: if multi-tenant is on but no tenantId and not allBranches, show nothing or just global
      query = query.is("tenant_id", null);
    }

    // Allow all authenticated users (Agents/Admins) to see all owners
    // if (ctx.role !== "ADMIN") {
    //   query = query.eq("created_by", ctx.user.id);
    // }

    const { data: owners, error } = await query;

    if (error) {
      console.error("Error fetching owners:", error);
      return [];
    }

    return owners ?? [];
  } catch (err) {
    // ถ้าไม่ได้ login ให้ return [] ไปก่อน (เพราะหน้า protected ปกติก็กันไว้แล้ว)
    console.error("getOwnersAction auth error:", err);
    return [];
  }
}

export async function getOwnerByIdAction(id: string) {
  const ctx = await requireAuthContext();
  assertStaff(ctx.role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = ctx.supabase
    .from("owners")
    .select("*")
    .eq("id", id);

  if (isMultiTenant && ctx.tenantId) {
    query = query.or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`);
  }

  const { data: owner, error } = await query.single();

  if (error || !owner) {
    console.error("Error fetching owner:", error);
    throw new Error(mapDbError(error) || "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการ");
  }

  assertAuthenticated({
    userId: ctx.user.id,
    role: ctx.role,
  });

  return owner;
}

export async function createOwnerAction(input: CreateOwnerInput) {
  try {
    const validated = ownerSchema.parse(input);
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    const { data: owner, error } = await ctx.supabase
      .from("owners")
      .insert({
        ...validated,
        created_by: ctx.user.id,
        tenant_id: ctx.tenantId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !owner) throw error;

    await logAudit(ctx, {
      action: "owner.create",
      entity: "owners",
      entityId: owner.id,
      metadata: {},
    });

    revalidatePath("/protected/owners");
    return { success: true, message: "เพิ่มเจ้าของสำเร็จ", id: owner.id };
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "AUTHZ_ERROR") return authzFail(err);
    console.error("createOwnerAction error:", err);
    return { 
      success: false, 
      message: err instanceof z.ZodError 
        ? err.issues[0].message 
        : mapDbError(err) || "ไม่สามารถสร้างข้อมูลเจ้าของทรัพย์ได้" 
    };
  }
}

export async function updateOwnerAction(id: string, input: CreateOwnerInput) {
  try {
    const validated = ownerSchema.parse(input);
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    // 1) Verify presence and branch isolation
    const { data: existing, error: findError } = await ctx.supabase
      .from("owners")
      .select("id, tenant_id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return { success: false, message: "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการ" };
    }

    const config = await getSystemConfig();
    if (config.multi_tenant_enabled && existing.tenant_id && existing.tenant_id !== ctx.tenantId && ctx.role !== "ADMIN") {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลของสาขาอื่น" };
    }

    const { error } = await ctx.supabase
      .from("owners")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    await logAudit(ctx, {
      action: "owner.update",
      entity: "owners",
      entityId: id,
      metadata: {},
    });

    revalidatePath("/protected/owners");
    revalidatePath("/protected/properties");
    return { success: true, message: "บันทึกข้อมูลสำเร็จ" };
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "AUTHZ_ERROR") return authzFail(err);
    console.error("updateOwnerAction error:", err);
    return { 
      success: false, 
      message: err instanceof z.ZodError 
        ? err.issues[0].message 
        : mapDbError(err) 
    };
  }
}

export async function deleteOwnerAction(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    if (!ctx.tenantId) throw new Error("Tenant context required");

    // 1) Verify presence and branch isolation
    const { data: existing, error: findError } = await ctx.supabase
      .from("owners")
      .select("id, tenant_id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return { success: false, message: "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการ" };
    }

    const config = await getSystemConfig();
    if (config.multi_tenant_enabled && existing.tenant_id && existing.tenant_id !== ctx.tenantId && ctx.role !== "ADMIN") {
      return { success: false, message: "คุณไม่มีสิทธิ์ลบข้อมูลของสาขาอื่น" };
    }

    // 🔗 DATA INTEGRITY: Check for linked properties
    const { count, error: countErr } = await ctx.supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", id);

    if (countErr) throw countErr;
    if (count && count > 0) {
      return { 
        success: false, 
        message: `ไม่สามารถลบเจ้าของท่านนี้ได้ เนื่องจากยังมีทรัพย์สินอีก ${count} รายการที่ผูกพันอยู่ กรุณาลบหรือย้ายเจ้าของทรัพย์สินก่อนดำเนินการ` 
      };
    }

    const { error } = await ctx.supabase
      .from("owners")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) throw error;

    await logAudit(ctx, {
      action: "owner.delete",
      entity: "owners",
      entityId: id,
      metadata: {},
    });

    revalidatePath("/protected/owners");
    revalidatePath("/protected/properties");
    return { success: true, message: "ลบเจ้าของสำเร็จ" };
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "AUTHZ_ERROR") return authzFail(err);
    return { success: false, message: mapDbError(err) };
  }
}


export async function getOwnersWithPropertyCountAction() {
  const ctx = await requireAuthContext();
  assertStaff(ctx.role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = ctx.supabase
    .from("owners")
    .select("*")
    .order("full_name");
  if (isMultiTenant && ctx.tenantId && ctx.tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`);
  }

  const { data: owners, error: ownersError } = await query;

  if (ownersError || !owners) {
    console.error("Error fetching owners:", ownersError);
    return [];
  }

  let countsQuery = ctx.supabase
    .from("properties")
    .select("owner_id");

  if (isMultiTenant && ctx.tenantId && ctx.tenantId !== "ALL") {
    countsQuery = countsQuery.eq("tenant_id", ctx.tenantId);
  }

  const { data: propertyCounts, error: countsError } = await countsQuery;

  if (countsError) {
    console.error("Error fetching property counts:", countsError);
    return owners.map((o) => ({ ...o, property_count: 0 }));
  }

  return calculatePropertyCounts(owners, propertyCounts ?? []);
}
