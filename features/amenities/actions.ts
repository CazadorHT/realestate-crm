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
 * Get features with V3 Architecture from public.features table
 */
export async function getFeatures(): Promise<FeatureRow[]> {
  try {
    const { supabase } = await requireAuthContext();

    const { data, error } = await supabase
      .from("features")
      .select("id, name, name_en, name_cn, name_ru, icon_key, category, created_at")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data as FeatureRow[];
  } catch (error) {
    console.error("getFeatures error:", error);
    return [];
  }
}

/**
 * Create a new feature in public.features table
 */
export async function createFeatureAction(
  values: FeatureFormValues,
): Promise<ActionState> {
  try {
    const { supabase, role } = await requireAuthContext();
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

    const { error } = await supabase.from("features").insert({
      id: crypto.randomUUID(),
      name,
      name_en: name_en || null,
      name_cn: name_cn || null,
      name_ru: name_ru || null,
      icon_key: icon_key || "check",
      category: category || "general",
    });

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "สร้างสิ่งอำนวยความสะดวกสำเร็จ" };
  } catch (error) {
    return authzFail(error);
  }
}

/**
 * Update an existing feature in public.features table
 */
export async function updateFeatureAction(
  id: string,
  values: FeatureFormValues,
): Promise<ActionState> {
  try {
    const { supabase, role } = await requireAuthContext();
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

    const { error } = await supabase
      .from("features")
      .update({
        name,
        name_en: name_en || null,
        name_cn: name_cn || null,
        name_ru: name_ru || null,
        icon_key: icon_key || "check",
        category: category || "general",
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "อัปเดตสิ่งอำนวยความสะดวกสำเร็จ" };
  } catch (error) {
    return authzFail(error);
  }
}

/**
 * Delete a feature from public.features table
 */
export async function deleteFeatureAction(id: string): Promise<ActionState> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase
      .from("features")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "ลบสิ่งอำนวยความสะดวกสำเร็จ" };
  } catch (error) {
    return authzFail(error);
  }
}
