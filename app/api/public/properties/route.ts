// create lead / นัดชม / ขอรายละเอียด (ป้องกัน spam)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PropertyRow = {
  id: string;
  title: string;
  description: string | null;
  property_type: string | null;
  price: number | null;
  rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  address_line1: string | null;
  popular_area: string | null;

  property_images?: Array<{
    image_url: string;
    is_cover: boolean | null;
    sort_order: number | null;
  }> | null;
};

function buildLocation(row: PropertyRow) {
  const parts = [
    row.address_line1,
    row.subdistrict,
    row.district,
    row.province,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

function pickCoverImage(
  images: PropertyRow["property_images"] | undefined | null
) {
  if (!images || images.length === 0) return null;

  const cover = images.find((img) => img.is_cover);
  if (cover?.image_url) return cover.image_url;

  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return sorted[0]?.image_url ?? null;
}

export async function GET() {
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
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load public properties" },
      { status: 500 }
    );
  }

  const items = (data ?? []).map((row) => {
    const typedRow = row as PropertyRow;
    return {
      id: typedRow.id,
      title: typedRow.title,
      description: typedRow.description,
      property_type: typedRow.property_type,
      price: typedRow.price,
      rental_price: typedRow.rental_price,
      bedrooms: typedRow.bedrooms,
      bathrooms: typedRow.bathrooms,
      created_at: typedRow.created_at,
      listing_type: typedRow.listing_type,
      popular_area: typedRow.popular_area,
      province: typedRow.province,
      district: typedRow.district,
      subdistrict: typedRow.subdistrict,
      address_line1: typedRow.address_line1,
      image_url: pickCoverImage(typedRow.property_images),
      location: buildLocation(typedRow),
    };
  });

  return NextResponse.json(items);
}
