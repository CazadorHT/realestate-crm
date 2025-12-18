// features/properties/queries.public.ts
import { createClient } from "@/lib/supabase/server";
import type { PropertyWithImages } from "./types";

export async function getPublicPropertyWithImagesBySlug(slug: string) {
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
    data.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  // ✅ public ไม่คืน storage_path
  return data as unknown as Omit<PropertyWithImages, "property_images"> & {
    property_images: Array<{
      id: string;
      property_id: string;
      image_url: string | null;
      is_cover: boolean | null;
      sort_order: number | null;
      created_at: string;
    }>;
  };
}
