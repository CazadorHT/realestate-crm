"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
} from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { getSystemConfig } from "@/lib/actions/system-config";
import { z } from "zod";
import { encrypt, decrypt, generateBlindIndex } from "@/lib/crypto";

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

    let query = ctx.supabase
      .from("identities_v3")
      .select("id, display_name, phone, line_id, social_links, created_at, updated_at, tenant_id")
      .eq("category", 2)
      .eq("role", "OWNER")
      .order("created_at", { ascending: false });

    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;

    if (!isMultiTenant) {
      // Single-tenant: show all
    } else if (allBranches && ctx.role === "ADMIN") {
      // Admin + allBranches: show all
    } else if (ctx.tenantId && ctx.tenantId !== "ALL") {
      query = query.or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`);
    } else if (isMultiTenant && !allBranches) {
      query = query.is("tenant_id", null);
    }

    const { data: owners, error } = await query;

    if (error) {
      console.error("Error fetching owners:", error);
      return [];
    }

    return (owners ?? []).map((o: any) => {
      const social = (o.social_links as Record<string, any>) || {};
      return {
        id: o.id,
        full_name: decrypt(o.display_name) || o.display_name || "Unknown",
        phone: decrypt(o.phone) || o.phone,
        line_id: decrypt(o.line_id) || o.line_id,
        facebook_url: decrypt(social.facebook_url) || social.facebook_url,
        other_contact: decrypt(social.other_contact) || social.other_contact,
        company_name: social.company_name,
        owner_type: social.owner_type,
        created_at: o.created_at,
        updated_at: o.updated_at,
        tenant_id: o.tenant_id,
        created_by: social.created_by,
      };
    });
  } catch (err) {
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
    .from("identities_v3")
    .select("id, display_name, phone, line_id, social_links, created_at, updated_at, tenant_id")
    .eq("id", id)
    .eq("category", 2)
    .eq("role", "OWNER");

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

  const social = (owner.social_links as Record<string, any>) || {};

  return {
    id: owner.id,
    full_name: decrypt(owner.display_name) || owner.display_name || "Unknown",
    phone: decrypt(owner.phone) || owner.phone,
    line_id: decrypt(owner.line_id) || owner.line_id,
    facebook_url: decrypt(social.facebook_url) || social.facebook_url,
    other_contact: decrypt(social.other_contact) || social.other_contact,
    company_name: social.company_name,
    owner_type: social.owner_type,
    created_at: owner.created_at,
    updated_at: owner.updated_at,
    tenant_id: owner.tenant_id,
    created_by: social.created_by,
  };
}

export async function createOwnerAction(input: CreateOwnerInput) {
  try {
    const validated = ownerSchema.parse(input);
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);
    
    let targetTenantId = ctx.tenantId;
    if (!targetTenantId) {
      const config = await getSystemConfig();
      targetTenantId = config.default_tenant_id ?? undefined;
    }

    const socialLinks = {
      facebook_url: encrypt(validated.facebook_url),
      other_contact: encrypt(validated.other_contact),
      company_name: validated.company_name,
      owner_type: validated.owner_type,
      created_by: ctx.user.id,
      full_name_hash: generateBlindIndex(validated.full_name),
      phone_hash: generateBlindIndex(validated.phone),
    };

    const { data: owner, error } = await ctx.supabase
      .from("identities_v3")
      .insert({
        display_name: encrypt(validated.full_name) || "Unknown",
        phone: encrypt(validated.phone),
        line_id: encrypt(validated.line_id),
        category: 2,
        role: "OWNER",
        social_links: socialLinks,
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !owner) throw error;

    await logAudit(ctx, {
      action: "owner.create",
      entity: "identities_v3",
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
    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;
    const isAdminUser = ctx.role === "ADMIN";

    // Non-admins must have a valid tenantId in multi-tenant mode
    if (!isAdminUser && isMultiTenant && !ctx.tenantId) {
      throw new Error("Tenant context required");
    }

    const { data: existing, error: findError } = await ctx.supabase
      .from("identities_v3")
      .select("id, tenant_id, social_links")
      .eq("id", id)
      .eq("category", 2)
      .eq("role", "OWNER")
      .single();

    if (findError || !existing) {
      return { success: false, message: "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการ" };
    }

    if (isMultiTenant && existing.tenant_id && ctx.tenantId && existing.tenant_id !== ctx.tenantId && !isAdminUser) {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลของสาขาอื่น" };
    }

    const existingSocial = (existing.social_links as Record<string, any>) || {};
    const canBypassOwnership = ctx.role === "ADMIN" || ctx.role === "MANAGER";
    const isOwner = existingSocial.created_by === ctx.user.id;

    if (!isOwner && !canBypassOwnership) {
      let creatorName = "ไม่ทราบชื่อผู้สร้าง";
      if (existingSocial.created_by) {
        const { data: creator } = await ctx.supabase
          .from("identities_v3")
          .select("display_name")
          .eq("id", existingSocial.created_by)
          .maybeSingle();
        if (creator?.display_name) {
          creatorName = decrypt(creator.display_name) || creator.display_name;
        }
      }
      return { success: false, message: `คุณไม่มีสิทธิ์แก้ไขข้อมูลเจ้าของทรัพย์สินของผู้อื่น (สิทธิ์การจัดการเป็นของ ${creatorName})` };
    }
    const socialLinks = {
      ...existingSocial,
      facebook_url: encrypt(validated.facebook_url),
      other_contact: encrypt(validated.other_contact),
      company_name: validated.company_name,
      owner_type: validated.owner_type,
      full_name_hash: generateBlindIndex(validated.full_name),
      phone_hash: generateBlindIndex(validated.phone),
    };

    let updateQuery = ctx.supabase
      .from("identities_v3")
      .update({
        display_name: encrypt(validated.full_name) || "Unknown",
        phone: encrypt(validated.phone),
        line_id: encrypt(validated.line_id),
        social_links: socialLinks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (isMultiTenant && !isAdminUser && ctx.tenantId) {
      updateQuery = updateQuery.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await updateQuery;

    if (error) throw error;

    await logAudit(ctx, {
      action: "owner.update",
      entity: "identities_v3",
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
    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;
    const isAdminUser = ctx.role === "ADMIN";

    // Non-admins must have a valid tenantId in multi-tenant mode
    if (!isAdminUser && isMultiTenant && !ctx.tenantId) {
      throw new Error("Tenant context required");
    }

    const { data: existing, error: findError } = await ctx.supabase
      .from("identities_v3")
      .select("id, tenant_id, social_links")
      .eq("id", id)
      .eq("category", 2)
      .eq("role", "OWNER")
      .single();

    if (findError || !existing) {
      return { success: false, message: "ไม่พบข้อมูลเจ้าของทรัพย์ที่ต้องการ" };
    }

    if (isMultiTenant && existing.tenant_id && ctx.tenantId && existing.tenant_id !== ctx.tenantId && !isAdminUser) {
      return { success: false, message: "คุณไม่มีสิทธิ์ลบข้อมูลของสาขาอื่น" };
    }

    const existingSocial = (existing.social_links as Record<string, any>) || {};
    const canBypassOwnership = ctx.role === "ADMIN" || ctx.role === "MANAGER";
    const isOwner = existingSocial.created_by === ctx.user.id;

    if (!isOwner && !canBypassOwnership) {
      let creatorName = "ไม่ทราบชื่อผู้สร้าง";
      if (existingSocial.created_by) {
        const { data: creator } = await ctx.supabase
          .from("identities_v3")
          .select("display_name")
          .eq("id", existingSocial.created_by)
          .maybeSingle();
        if (creator?.display_name) {
          creatorName = decrypt(creator.display_name) || creator.display_name;
        }
      }
      return { success: false, message: `คุณไม่มีสิทธิ์ลบข้อมูลเจ้าของทรัพย์สินของผู้อื่น (สิทธิ์การจัดการเป็นของ ${creatorName})` };
    }

    const { count, error: countErr } = await ctx.supabase
      .from("properties_core")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", id);

    if (countErr) throw countErr;
    if (count && count > 0) {
      return { 
        success: false, 
        message: `ไม่สามารถลบเจ้าของท่านนี้ได้ เนื่องจากยังมีทรัพย์สินอีก ${count} รายการที่ผูกพันอยู่ กรุณาลบหรือย้ายเจ้าของทรัพย์สินก่อนดำเนินการ` 
      };
    }

    const adminClient = createAdminClient();

    // 1. Delete tenant memberships first to avoid foreign key violation
    const { error: memberDeleteError } = await adminClient
      .from("tenant_members_v3")
      .delete()
      .eq("identity_id", id);

    if (memberDeleteError) throw memberDeleteError;

    // 2. Delete the owner identity
    let deleteQuery = adminClient
      .from("identities_v3")
      .delete()
      .eq("id", id);

    if (isMultiTenant && !isAdminUser && ctx.tenantId) {
      deleteQuery = deleteQuery.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await deleteQuery;

    if (error) throw error;

    await logAudit(ctx, {
      action: "owner.delete",
      entity: "identities_v3",
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
    .from("identities_v3")
    .select("id, display_name, phone, line_id, social_links, created_at, updated_at, tenant_id")
    .eq("category", 2)
    .eq("role", "OWNER")
    .order("created_at", { ascending: false });
    
  if (isMultiTenant && ctx.tenantId && ctx.tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`);
  }

  const { data: ownersRaw, error: ownersError } = await query;

  if (ownersError || !ownersRaw) {
    console.error("Error fetching owners:", ownersError);
    return [];
  }

  let countsQuery = ctx.supabase
    .from("properties_core")
    .select("owner_id");

  if (isMultiTenant && ctx.tenantId && ctx.tenantId !== "ALL") {
    countsQuery = countsQuery.eq("tenant_id", ctx.tenantId);
  }

  const { data: propertyCounts, error: countsError } = await countsQuery;

  const decryptedOwners = ownersRaw.map((o: any) => {
    const social = (o.social_links as Record<string, any>) || {};
    return {
      id: o.id,
      full_name: decrypt(o.display_name) || o.display_name || "Unknown",
      phone: decrypt(o.phone) || o.phone,
      line_id: decrypt(o.line_id) || o.line_id,
      facebook_url: decrypt(social.facebook_url) || social.facebook_url,
      other_contact: decrypt(social.other_contact) || social.other_contact,
      company_name: social.company_name,
      owner_type: social.owner_type,
      created_at: o.created_at,
      updated_at: o.updated_at,
      tenant_id: o.tenant_id,
      created_by: social.created_by,
    };
  });

  if (countsError) {
    console.error("Error fetching property counts:", countsError);
    return decryptedOwners.map((o) => ({
      ...o,
      property_count: 0,
    }));
  }

  return calculatePropertyCounts(decryptedOwners, propertyCounts ?? []);
}
