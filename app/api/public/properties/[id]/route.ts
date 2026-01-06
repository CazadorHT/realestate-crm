// detail (ใช้ในหน้ารายละเอียด)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function pickCoverImage(images: any[] | null | undefined) {
  if (!images?.length) return null;
  const cover = images.find((img) => img.is_cover);
  if (cover?.image_url) return cover.image_url;
  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return sorted[0]?.image_url ?? null;
}

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> }
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
          is_cover,
          sort_order
        )
      `
    )
    .eq("id", params.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load property detail" },
      { status: 500 }
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
