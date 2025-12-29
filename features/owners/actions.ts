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

import type { OwnerFormValues } from "./types";

export async function getOwnersAction() {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    let query = ctx.supabase.from("owners").select("*").order("full_name");

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

  const { data: owner, error } = await ctx.supabase
    .from("owners")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !owner) {
    console.error("Error fetching owner:", error);
    throw new Error("Owner not found");
  }

  assertAuthenticated({
    userId: ctx.user.id,
    role: ctx.role,
  });

  return owner;
}

export async function createOwnerAction(values: OwnerFormValues) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { data: owner, error } = await ctx.supabase
      .from("owners")
      .insert({
        full_name: values.full_name,
        phone: values.phone || null,
        line_id: values.line_id || null,
        facebook_url: values.facebook_url || null,
        other_contact: values.other_contact || null,
        owner_type: (values as any).owner_type ?? null, // ถ้าใน form มีจริงค่อยปรับ type ให้ตรง
        company_name: (values as any).company_name ?? null,
        created_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !owner)
      return {
        success: false,
        message: error?.message ?? "Create owner failed",
      };

    await logAudit(ctx, {
      action: "owner.create",

      entity: "owners",
      entityId: owner.id,
      metadata: {},
    });

    revalidatePath("/protected/owners");
  } catch (err) {
    return authzFail(err);
  }
  redirect("/protected/owners");
}

export async function updateOwnerAction(id: string, values: OwnerFormValues) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    // 1) Verify ownership
    const { data: existing, error: findError } = await ctx.supabase
      .from("owners")
      .select("created_by")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return { success: false, message: "Owner not found" };
    }

    assertAuthenticated({
      userId: ctx.user.id,
      role: ctx.role,
    });

    const { error } = await ctx.supabase
      .from("owners")
      .update({
        full_name: values.full_name,
        phone: values.phone || null,
        line_id: values.line_id || null,
        facebook_url: values.facebook_url || null,
        other_contact: values.other_contact || null,
        owner_type: (values as any).owner_type ?? null,
        company_name: (values as any).company_name ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "owner.update",
      entity: "owners",
      entityId: id,
      metadata: {},
    });

    revalidatePath("/protected/owners");
    revalidatePath("/protected/properties");
  } catch (err) {
    return authzFail(err);
  }
  redirect("/protected/owners");
}

export async function deleteOwnerAction(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    // 1) Verify ownership
    const { data: existing, error: findError } = await ctx.supabase
      .from("owners")
      .select("created_by")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return { success: false, message: "Owner not found" };
    }

    assertAuthenticated({
      userId: ctx.user.id,
      role: ctx.role,
    });

    const { error } = await ctx.supabase.from("owners").delete().eq("id", id);
    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "owner.delete",
      entity: "owners",
      entityId: id,
      metadata: {},
    });

    revalidatePath("/protected/owners");
    revalidatePath("/protected/properties");
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}

export async function getOwnersWithPropertyCountAction() {
  const ctx = await requireAuthContext();
  assertStaff(ctx.role);

  let query = ctx.supabase.from("owners").select("*").order("full_name");

  // Allow all authenticated users (Agents/Admins) to see all owners
  // if (ctx.role !== "ADMIN") {
  //   query = query.eq("created_by", ctx.user.id);
  // }

  const { data: owners, error: ownersError } = await query;

  if (ownersError || !owners) {
    console.error("Error fetching owners:", ownersError);
    return [];
  }

  const { data: propertyCounts, error: countsError } = await ctx.supabase
    .from("properties")
    .select("owner_id");

  if (countsError) {
    console.error("Error fetching property counts:", countsError);
    return owners.map((o) => ({ ...o, property_count: 0 }));
  }

  const countMap = new Map<string, number>();
  (propertyCounts ?? []).forEach((p) => {
    if (p.owner_id)
      countMap.set(p.owner_id, (countMap.get(p.owner_id) || 0) + 1);
  });

  return owners.map((owner) => ({
    ...owner,
    property_count: countMap.get(owner.id) || 0,
  }));
}
