"use server";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PropertyRow, PropertyWithImages } from "../types";

/**
 * Get property by ID with images
 */
export async function getPropertyById(id: string): Promise<PropertyRow> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (propErr) throw propErr;

    // ✅ กันอ่านของคนอื่น
    assertAuthenticated({
      userId: user.id,
      role,
    });

    return property;
  } catch (error) {
    console.error("getPropertyById → error:", error);
    throw error;
  }
}

/**
 * Get property with images
 */
export async function getPropertyWithImages(
  id: string,
): Promise<PropertyWithImages> {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        storage_path,
        is_cover,
        sort_order,
        created_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) throw error;

  const property = data as unknown as PropertyWithImages;

  if (property.property_images) {
    property.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  return property;
}

/**
 * Get all popular areas from database
 */
export async function getPopularAreasAction(
  params: { onlyActive?: boolean } = { onlyActive: true },
) {
  // Allow public access (no auth required)
  const supabase = await createAdminClient();

  const { data: allAreas, error } = await supabase
    .from("popular_areas")
    .select("name, name_cn, name_en")
    .order("name");

  if (error) {
    console.error("getPopularAreasAction error:", error);
    return [];
  }

  // If we want ALL areas (for Admin/Form), return everything
  if (params.onlyActive === false) {
    return allAreas.map((item) => item.name);
  }

  // Check which areas actually have active properties
  const { data: activeProps } = await supabase
    .from("properties")
    .select("popular_area")
    .eq("status", "ACTIVE")
    .not("popular_area", "is", null);

  const activeSet = new Set((activeProps || []).map((p) => p.popular_area));

  // Return intersection
  return allAreas
    .filter((area) => activeSet.has(area.name))
    .map((item) => ({
      name: item.name,
      name_en: item.name_en,
      name_cn: item.name_cn,
    }));
}

/**
 * Add a new popular area to the database
 */
export async function addPopularAreaAction(name: string) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  if (!name || name.trim() === "") {
    return { success: false, message: "กรุณาระบุชื่อย่าน" };
  }

  const { error } = await supabase.from("popular_areas").insert({
    name: name.trim(),
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "ย่านนี้มีอยู่แล้ว" };
    }
    console.error("addPopularAreaAction error:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}
