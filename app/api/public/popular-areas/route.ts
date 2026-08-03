import { NextResponse } from "next/server";
import { getPopularAreasAction, getPublicProvincesAction } from "@/features/public/popular-areas";
export const dynamic = 'force-dynamic'; // เพิ่มบรรทัดนี้
export const revalidate = 3600; // Cache for 1 hour
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const requestedProvince = searchParams.get("province") || undefined;
 
    // 1) Handle "provinces" mode: Return list of all provinces with active properties
    if (mode === "provinces") {
      const result = await getPublicProvincesAction();
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
        },
      });
    }
    // 2) Handle default mode: Fetch popular areas using the shared action
    const popularAreas = await getPopularAreasAction(requestedProvince);
    return NextResponse.json(popularAreas, {
      headers: {
        "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error("popular-areas route crash:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
