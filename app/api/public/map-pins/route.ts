import { NextResponse } from "next/server";
import { getPublicMapPins } from "@/lib/services/map-pins";

/**
 * Lightweight Full-Inventory Map Pins Endpoint (~20 KB compressed)
 * - Strictly separated from paginated card API (/api/public/properties?limit=12)
 * - Backed by 1-year Next.js Data Cache + Cloudflare Edge Cache
 * - Client filters & clusters in browser memory (0 extra requests on pan/zoom/filter)
 */
export async function GET() {
  try {
    const payload = await getPublicMapPins();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("[API /api/public/map-pins] Error:", error);
    return NextResponse.json(
      { pins: [], stations: [], generatedAt: Date.now() },
      { status: 500 }
    );
  }
}
