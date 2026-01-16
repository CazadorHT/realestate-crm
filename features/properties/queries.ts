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

export type PropertyStats = {
  total: number;
  available: number;
  soldOrRented: number;
  totalValue: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
};

export async function getPropertiesDashboardStatsQuery(): Promise<PropertyStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("id, status, price, property_type, listing_type");

  if (error || !data) {
    return {
      total: 0,
      available: 0,
      soldOrRented: 0,
      totalValue: 0,
      byType: [],
      byStatus: [],
    };
  }

  const total = data.length;
  // Change "AVAILABLE/FOR_SALE/FOR_RENT" to actual enum "ACTIVE"
  const active = data.filter((p) => p.status === "ACTIVE").length;
  const soldOrRented = data.filter((p) =>
    ["SOLD", "RENTED"].includes(p.status)
  ).length;

  // Sum price of ACTIVE properties
  const totalValue = data
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + (p.price || 0), 0);

  // Group by Type
  const typeMap = new Map<string, number>();
  data.forEach((p) => {
    const t = p.property_type || "Unknown";
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  });
  const byType = Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // Group by Status
  const statusMap = new Map<string, number>();
  data.forEach((p) => {
    const s = p.status || "Unknown";
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const byStatus = Array.from(statusMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    total,
    available: active, // Send 'active' as 'available' to match frontend prop or rename in type?
    // I will keep the key 'available' in PropertyStats to minimize refactor,
    // but logically it represents ACTIVE.
    soldOrRented,
    totalValue,
    byType,
    byStatus,
  };
}
