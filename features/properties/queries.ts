/**
 * ✅ ฝั่ง Public pages (เช่น (public)/property/[slug]/page.tsx)
 * import { getPublicPropertyWithImagesBySlug } from "@/features/properties/queries";
    const data = await getPublicPropertyWithImagesBySlug(slug);
    if (!data) notFound(); 

    ✅ฝั่ง Protected pages (เช่น /protected/properties/[id]/page.tsx)
    import { getProtectedPropertyWithImagesById } from "@/features/properties/queries";
    const data = await getProtectedPropertyWithImagesById(id);
*/

import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyImageRow =
  Database["public"]["Tables"]["property_images"]["Row"];

export type PropertyWithImages = PropertyRow & {
  property_images: PropertyImageRow[];
};

// ✅ Public: ไม่คืน storage_path (ลดความเสี่ยงข้อมูลภายในรั่ว)
export type PublicPropertyImage = Pick<
  PropertyImageRow,
  "id" | "property_id" | "image_url" | "is_cover" | "sort_order" | "created_at"
>;
export type PublicPropertyWithImages = PropertyRow & {
  property_images: PublicPropertyImage[];
};

/**
 * ✅ PUBLIC: ใช้ในหน้า public เท่านั้น
 * - filter status = PUBLISHED
 * - query ด้วย slug
 * - ไม่ require auth
 */
export async function getPublicPropertyWithImagesBySlug(
  slug: string
): Promise<PublicPropertyWithImages | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        is_cover,
        sort_order,
        created_at
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  }

  return data as unknown as PublicPropertyWithImages;
}
/**
 * ✅ PROTECTED: ใช้ใน CRM เท่านั้น
 * - require auth
 * - authenticated user (Agent/Admin)
 * - query ด้วย id
 */
export async function getProtectedPropertyWithImagesById(
  id: string
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
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) throw error;

  // ✅ Authorization check (authenticated)

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  }

  return data as unknown as PropertyWithImages;
}

/**
 * Return minimal properties for select inputs in protected CRM
 */
export async function getPropertiesForSelect() {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, title, price, rental_price, commission_sale_percentage, commission_rent_months`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
