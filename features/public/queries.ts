import { createClient } from "@/lib/supabase/server";
import { PublicProperty, PublicPropertyFilter } from "./types";

export async function getPublicProperties(
  filter: PublicPropertyFilter,
): Promise<PublicProperty[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, property_images(image_url)")
    .eq("status", "ACTIVE")
    .order("updated_at", { ascending: false });

  if (filter.listingType) {
    query = query.eq("listing_type", filter.listingType);
  }

  if (filter.q) {
    query = query.ilike("title", `%${filter.q}%`);
  }

  const effectivePriceType = filter.priceType || filter.listingType || "SALE";

  if (filter.minPrice || filter.maxPrice) {
    const min = filter.minPrice || 0;
    const max = filter.maxPrice || 2147483647; // Default max for INT

    if (effectivePriceType === "RENT") {
      query = query.or(
        `and(rental_price.gte.${min},rental_price.lte.${max}),and(original_rental_price.gte.${min},original_rental_price.lte.${max})`,
      );
    } else {
      query = query.or(
        `and(price.gte.${min},price.lte.${max}),and(original_price.gte.${min},original_price.lte.${max})`,
      );
    }
  }

  // Size filtering
  if (filter.minSize) {
    query = query.gte("size_sqm", filter.minSize);
  }

  if (filter.maxSize) {
    query = query.lte("size_sqm", filter.maxSize);
  }

  if (filter.limit) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching public properties:", error);
    return [];
  }

  return data as PublicProperty[];
}

export async function getPublicPropertyBySlug(
  slug: string,
): Promise<PublicProperty | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(image_url)")
    .eq("status", "ACTIVE")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as PublicProperty;
}
