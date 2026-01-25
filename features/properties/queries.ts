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
  slug: string,
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
    `,
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
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

  // ✅ Authorization check (authenticated)

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
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
      `id, title, price, original_price, rental_price, original_rental_price, commission_sale_percentage, commission_rent_months, property_images(image_url, is_cover)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Map to include cover_image
  return (data ?? []).map((p) => ({
    ...p,
    cover_image:
      p.property_images?.find((img: any) => img.is_cover)?.image_url ||
      p.property_images?.[0]?.image_url ||
      null,
  }));
}

export type PropertyStats = {
  total: number;
  available: number;
  soldOrRented: number;
  totalValue: number;
  totalSaleCommission: number;
  totalRentCommission: number;
  totalRealizedCommission: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
};

export async function getPropertiesDashboardStatsQuery(): Promise<PropertyStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, status, price, rental_price, original_price, original_rental_price, property_type, listing_type, commission_sale_percentage, commission_rent_months",
    );

  if (error || !data) {
    return {
      total: 0,
      available: 0,
      soldOrRented: 0,
      totalValue: 0,
      totalSaleCommission: 0,
      totalRentCommission: 0,
      totalRealizedCommission: 0,
      byType: [],
      byStatus: [],
    };
  }

  const total = data.length;
  // Change "AVAILABLE/FOR_SALE/FOR_RENT" to actual enum "ACTIVE"
  const active = data.filter((p) => p.status === "ACTIVE").length;
  const soldOrRented = data.filter((p) =>
    ["SOLD", "RENTED"].includes(p.status),
  ).length;

  // Sum price of ACTIVE properties (fallback to original_price if price is missing)
  const totalValue = data
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + (p.price || p.original_price || 0), 0);

  // Calculate Commissions separately
  let totalSaleCommission = 0;
  let totalRentCommission = 0;
  let totalRealizedCommission = 0;

  data.forEach((p) => {
    // Determine effective prices (use original if current is missing)
    const salePrice = (p.price || 0) > 0 ? p.price : p.original_price || 0;
    const rentPrice =
      (p.rental_price || 0) > 0 ? p.rental_price : p.original_rental_price || 0;

    // 1. Sale/Rent Potential Calculation (Only for ACTIVE)
    if (p.status === "ACTIVE") {
      // Sale Potential
      if (
        (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") &&
        salePrice &&
        salePrice > 0
      ) {
        totalSaleCommission +=
          (salePrice * (p.commission_sale_percentage || 3)) / 100;
      }

      // Rent Potential
      if (
        (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") &&
        rentPrice &&
        rentPrice > 0
      ) {
        totalRentCommission += rentPrice * (p.commission_rent_months || 1);
      }
    }

    // 2. Realized Commission Calculation (SOLD or RENTED)
    if (p.status === "SOLD") {
      // For sold items, prefer price, fallback to original
      const finalPrice = (p.price || 0) > 0 ? p.price : p.original_price || 0;
      if (finalPrice && finalPrice > 0) {
        totalRealizedCommission +=
          (finalPrice * (p.commission_sale_percentage || 3)) / 100;
      }
    } else if (p.status === "RENTED") {
      // For rented items, prefer rental_price
      const finalRentPrice =
        (p.rental_price || 0) > 0
          ? p.rental_price
          : p.original_rental_price || 0;
      if (finalRentPrice && finalRentPrice > 0) {
        totalRealizedCommission +=
          finalRentPrice * (p.commission_rent_months || 1);
      }
    }
  });

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
    totalSaleCommission,
    totalRentCommission,
    totalRealizedCommission,
    byType,
    byStatus,
  };
}
