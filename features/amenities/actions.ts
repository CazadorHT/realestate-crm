"use server";

import { revalidatePath } from "next/cache";
import { FeatureSchema, type FeatureFormValues } from "./schema";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import type { Database } from "@/lib/database.types.generated";

/**
 * Shape of unflattened feature row for UI components.
 * Replaces legacy Database["public"]["Tables"]["features"]["Row"]
 * Matches V3 Architecture where features are stored in system_settings_v3 as JSONB.
 */
export type FeatureRow = {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  name_ru?: string | null;
  icon_key?: string | null;
  category?: string | null;
  created_at?: string | null;
};

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: unknown;
};

/**
 * Get features with tenant isolation and V3 JSONB unpacking
 */
export async function getFeatures(): Promise<FeatureRow[]> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let query = supabase
      .from("system_settings_v3")
      .select("id, key, value, updated_at")
      .eq("category", "features_list");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    // Map JSONB value to FeatureRow shape
    const features: FeatureRow[] = data.map((item) => {
      const val = (item.value as Record<string, unknown> | null) || {};
      const names = (val.name as Record<string, unknown> | null) || {};
      return {
        id: item.id,
        name: (names.th as string) || (val.name as string) || "",
        name_en: (names.en as string) || (val.name_en as string) || null,
        name_cn: (names.cn as string) || (val.name_cn as string) || null,
        name_ru: (names.ru as string) || (val.name_ru as string) || null,
        icon_key: item.key || (val.icon_key as string) || null,
        category: (val.category as string) || null,
        created_at: item.updated_at || null,
      };
    });

    // Sort by category, then name
    return features.sort((a, b) => {
      const catA = a.category || "";
      const catB = b.category || "";
      if (catA !== catB) return catA.localeCompare(catB);
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("getFeatures error:", error);
    return [];
  }
}

/**
 * Create a new feature in V3 system_settings_v3
 */
export async function createFeatureAction(
  values: FeatureFormValues,
): Promise<ActionState> {
  try {
    const { supabase, role, tenantId, user } = await requireAuthContext();
    assertStaff(role);

    const parsed = FeatureSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      };
    }

    const { name, name_en, name_cn, name_ru, icon_key, category } = parsed.data;

    const valuePayload = {
      name: {
        th: name,
        en: name_en || "",
        cn: name_cn || "",
        ru: name_ru || "",
      },
      icon_key: icon_key || "check",
      category: category || "general",
    };

    const { error } = await supabase.from("system_settings_v3").insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId ?? null,
      category: "features_list",
      key: icon_key || `feature_${Date.now()}`,
      value: valuePayload,
      updated_by: user?.id ?? null,
    });

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "สร้างสิ่งอำนวยความสะดวกสำเร็จ" };
  } catch (error) {
    return authzFail(error);
  }
}

/**
 * Update an existing feature in V3 system_settings_v3
 */
export async function updateFeatureAction(
  id: string,
  values: FeatureFormValues,
): Promise<ActionState> {
  try {
    const { supabase, role, tenantId, user } = await requireAuthContext();
    assertStaff(role);

    const parsed = FeatureSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      };
    }

    const { name, name_en, name_cn, name_ru, icon_key, category } = parsed.data;

    const valuePayload = {
      name: {
        th: name,
        en: name_en || "",
        cn: name_cn || "",
        ru: name_ru || "",
      },
      icon_key: icon_key || "check",
      category: category || "general",
    };

    let updateQuery = supabase
      .from("system_settings_v3")
      .update({
        key: icon_key || `feature_${Date.now()}`,
        value: valuePayload,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("id", id)
      .eq("category", "features_list");

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error } = await updateQuery;

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "อัปเดตสิ่งอำนวยความสะดวกสำเร็จ" };
  } catch (error) {
    return authzFail(error);
  }
}

/**
 * Delete a feature from V3 system_settings_v3
 */
export async function deleteFeatureAction(id: string): Promise<ActionState> {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    let deleteQuery = supabase
      .from("system_settings_v3")
      .delete()
      .eq("id", id)
      .eq("category", "features_list");

    if (tenantId) {
      deleteQuery = deleteQuery.eq("tenant_id", tenantId);
    }

    const { error } = await deleteQuery;

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "ลบสิ่งอำนวยความสะดวกสำเร็จ" };
  } catch (error) {
    return authzFail(error);
  }
}
