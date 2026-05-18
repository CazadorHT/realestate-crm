"use server";

import { createClient } from "@/lib/supabase/server";
import { type Database, type Json } from "@/lib/database.types.generated";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";

export interface MasterDataTransitType {
  code: string;
  label: {
    th: string;
    en: string;
    cn: string;
    ru: string;
  };
  metadata?: {
    color?: string;
    bg_color?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Fetch all active transit types from ref_master_data
 */
export async function getTransitTypesAction(): Promise<MasterDataTransitType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ref_master_data")
    .select("code, label, metadata")
    .eq("type", "TRANSIT_TYPE")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching transit types:", error);
    return [];
  }

  type MasterDataRow = Database["public"]["Tables"]["ref_master_data"]["Row"];

  return (data as MasterDataRow[] || []).map((item: MasterDataRow) => ({
    code: item.code,
    label: (item.label as MasterDataTransitType["label"]) || { 
      th: item.code, 
      en: item.code, 
      cn: item.code, 
      ru: item.code 
    },
    metadata: item.metadata as MasterDataTransitType["metadata"]
  }));
}

export async function upsertMasterDataAction(input: {
  type: string;
  code: string;
  label: MasterDataTransitType["label"];
  metadata?: Record<string, any>;
  sort_order?: number;
  is_active?: boolean;
}) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("ref_master_data")
      .upsert({
        type: input.type,
        code: input.code,
        label: input.label as unknown as Json,
        metadata: (input.metadata || {}) as Json,
        sort_order: input.sort_order || 0,
        is_active: input.is_active ?? true,
      });

    if (error) throw error;

    // V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "MASTER_DATA_UPDATE",
      target_entity: "ref_master_data",
      target_id: `${input.type}:${input.code}`,
      tenant_id: ctx.tenantId || "SYSTEM",
      actor_id: ctx.user.id,
      metadata: { type: input.type, code: input.code } as Json,
      description: `อัปเดต Master Data: ${input.type} [${input.code}]`
    });

    return { success: true, message: "บันทึกข้อมูล Master Data สำเร็จ ✨" };
  } catch (err: any) {
    console.error("upsertMasterData error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Generic CRUD: Delete master data entry
 */
export async function deleteMasterDataAction(type: string, code: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("ref_master_data")
      .delete()
      .eq("type", type)
      .eq("code", code);

    if (error) throw error;

    // V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "MASTER_DATA_DELETE",
      target_entity: "ref_master_data",
      target_id: `${type}:${code}`,
      tenant_id: ctx.tenantId || "SYSTEM",
      actor_id: ctx.user.id,
      description: `ลบ Master Data: ${type} [${code}]`
    });

    return { success: true, message: "ลบข้อมูล Master Data สำเร็จ 🗑️" };
  } catch (err: any) {
    console.error("deleteMasterData error:", err);
    return { success: false, message: mapDbError(err) };
  }
}
