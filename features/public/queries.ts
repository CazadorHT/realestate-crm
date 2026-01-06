import { createClient } from "@/lib/supabase/server";
import { PublicProperty, PublicPropertyFilter } from "./types";

export async function getPublicProperties(
  filter: PublicPropertyFilter
): Promise<PublicProperty[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, property_images(image_url)")
    .eq("status", "ACTIVE")
    .order("updated_at", { ascending: false });

  if (filter.type) {
    query = query.eq("listing_type", filter.type);
  }

  if (filter.q) {
    query = query.ilike("title", `%${filter.q}%`);
  }

  if (filter.limit) {
    query = query.limit(filter.limit);
  }

  // TODO: Add more filters (price, area) as needed

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching public properties:", error);
    return [];
  }

  return data as PublicProperty[];
}

export async function getPublicPropertyBySlug(
  slug: string
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
