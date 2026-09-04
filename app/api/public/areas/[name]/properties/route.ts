import { NextResponse } from "next/server";
import { getPropertiesInArea } from "@/features/public/areas";

export async function GET(
  request: Request,
  props: { params: Promise<{ name: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);

  const decodedName = decodeURIComponent(params.name);
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 100);
  const offset = Number(searchParams.get("offset")) || 0;
  const listing_type = searchParams.get("listing_type") || undefined;
  const property_type = searchParams.get("property_type") || undefined;

  try {
    const result = await getPropertiesInArea(decodedName, {
      limit,
      offset,
      listing_type: listing_type === "ALL" ? undefined : listing_type,
      property_type: property_type === "ALL" ? undefined : property_type,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Failed to get properties in area:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
