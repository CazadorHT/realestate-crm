"use server";

import { revalidatePath } from "next/cache";
import { FeatureSchema, type FeatureFormValues } from "./schema";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import type { Database } from "@/lib/database.types";

export type FeatureRow = Database["public"]["Tables"]["features"]["Row"];

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: unknown;
};

export async function getFeatures(): Promise<FeatureRow[]> {
  try {
    const { supabase } = await requireAuthContext();
    // Allow any auth user to read or restrict to staff?
    // Usually features are public readable, but for admin listing let's use the context

    const { data, error } = await supabase
      .from("features")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getFeatures error:", error);
    return [];
  }
}

export async function createFeatureAction(
  values: FeatureFormValues
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

    const { name, icon_key, category } = parsed.data;

    const { error } = await supabase.from("features").insert({
      name,
      icon_key,
      category,
    });

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "Feature created successfully" };
  } catch (error) {
    return authzFail(error);
  }
}

export async function updateFeatureAction(
  id: string,
  values: FeatureFormValues
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

    const { name, icon_key, category } = parsed.data;

    const { error } = await supabase
      .from("features")
      .update({
        name,
        icon_key,
        category,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "Feature updated successfully" };
  } catch (error) {
    return authzFail(error);
  }
}

export async function deleteFeatureAction(id: string): Promise<ActionState> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase.from("features").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/features");
    return { success: true, message: "Feature deleted successfully" };
  } catch (error) {
    return authzFail(error);
  }
}
