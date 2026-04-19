import { createClient } from "@/lib/supabase/server";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PublicPropertyWithImages } from "./types";

/**
 * ✅ PUBLIC: ใช้ในหน้า public เท่านั้น
 * - filter status = ACTIVE
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
      id, title, title_en, title_cn, description, description_en, description_cn, 
      price, rental_price, 
      property_type, listing_type, bedrooms, bathrooms, size_sqm, land_size_sqwah, 
      floor, parking_slots, facing_north, facing_south, facing_east, facing_west, 
      allow_smoking, is_central_air, is_bare_shell, has_city_view, has_pool_view, 
      has_garden_view, has_river_view, has_private_pool, has_private_elevator, 
      has_unblocked_view, has_247_access, has_multi_parking, has_raised_floor, 
      has_fiber_optic, is_cbd, province, district, subdistrict, 
      address_line1, address_line1_en, address_line1_cn, postal_code, 
      popular_area, google_maps_link, nearby_transits, nearby_places, slug, 
      meta_title, meta_description, meta_keywords, structured_data, 
      verified, status, created_at,
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
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.property_images) {
    data.property_images.sort(
      (a: { sort_order?: number | null }, b: { sort_order?: number | null }) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }

  return data as unknown as PublicPropertyWithImages;
}

/**
 * AI Recommended Properties based on category preference
 */
export async function getRecommendedProperties(
  category: string,
  limit: number = 4,
) {
  const supabase = await createClient();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  // Note: tenantId is not strictly required for public recommendations 
  // unless we want to filter by the current sub-domain context (handled by other logic)
  
  let query = supabase
    .from("properties")
    .select(
      `
      id, title, price, rental_price, 
      popular_area, province, property_type, listing_type, slug, 
      property_images(image_url, is_cover)
    `,
    )
    .eq("status", "ACTIVE")
    .eq("property_type", category as any)
    .is("deleted_at", null);

  const { data, error } = await query
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data || []).map((p: any) => ({
    ...p,
    cover_image:
      p.property_images?.find((img: any) => img.is_cover)?.image_url ||
      p.property_images?.[0]?.image_url ||
      null,
  }));
}
