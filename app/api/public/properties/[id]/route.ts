import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/features/properties/image-utils";

function pickCoverImage(images: any[] | null | undefined) {
  if (!images?.length) return null;
  const cover = images.find((img) => img.is_cover) || images[0];
  if (!cover) return null;

  if (cover.image_url && cover.image_url.startsWith("http")) {
    return cover.image_url;
  }

  if (cover.storage_path) {
    return getPublicImageUrl(cover.storage_path);
  }

  return cover.image_url ?? null;
}

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
        id,
        title,
        description,
        property_type,
        price,
        rental_price,
        bedrooms,
        bathrooms,
        created_at,
        listing_type,
        popular_area,
        province,
        district,
        subdistrict,
        address_line1,
        property_images (
          image_url,
          storage_path,
          is_cover,
          sort_order
        )
      `,
    )
    .eq("id", params.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load property detail" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...data,
    cover_image_url: pickCoverImage((data as any).property_images),
  });
}
