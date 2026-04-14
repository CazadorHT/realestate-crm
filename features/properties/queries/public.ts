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
    .is("deleted_at", null)
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
      id, title, price, original_price, rental_price, original_rental_price, 
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

  return (data || []).map((p) => ({
    ...p,
    cover_image:
      p.property_images?.find((img) => img.is_cover)?.image_url ||
      p.property_images?.[0]?.image_url ||
      null,
  }));
}
