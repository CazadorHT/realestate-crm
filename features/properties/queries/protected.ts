import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyWithImages } from "../types";

/**
 * ✅ PROTECTED: ใช้ใน CRM เท่านั้น
 * - require auth
 * - authenticated user (Agent/Admin)
 * - query ด้วย id
 */
export async function getProtectedPropertyWithImagesById(
  id: string,
): Promise<PropertyWithImages> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select(
      `
      id, title, title_en, title_cn, title_ru, description, description_en, description_cn, description_ru,
      property_type, listing_type, price, original_price, rental_price, original_rental_price,
      currency, address_line1, address_line1_en, address_line1_cn, address_line1_ru,
      subdistrict, district, province, postal_code, bedrooms, bathrooms,
      size_sqm, land_size_sqwah, total_units, sold_units, floor, orientation,
      parking_slots, is_fully_furnished, is_pet_friendly,
      status, view_count, is_hot_deal, is_exclusive,
      created_at, updated_at,
      tenant_id, created_by, owner_id, co_agent_sale_commission_percent,
      popular_area, popular_area_en, popular_area_cn, popular_area_ru, property_source,
      ai_summary_content, ai_reviewed_at,
      ai_reviewed_by, version, images, nearby_places, nearby_transits,
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
    .is("deleted_at", null);

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.single();

  if (error || !data) throw error;

  if (data.property_images) {
    data.property_images.sort(
      (a: { sort_order: number | null }, b: { sort_order: number | null }) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }

  return data as unknown as PropertyWithImages;
}
