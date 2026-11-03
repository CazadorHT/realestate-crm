import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteCacheEntry {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  timestamp: number;
}

const memoryCache = new Map<string, RouteCacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start"); // "lng,lat"
    const end = searchParams.get("end"); // "lng,lat"
    const mode = searchParams.get("mode") === "drive" ? "driving" : "foot";

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end coordinates required (format: lng,lat)" },
        { status: 400 }
      );
    }

    const [startLng, startLat] = start.split(",").map(Number);
    const [endLng, endLat] = end.split(",").map(Number);

    if (
      !Number.isFinite(startLng) ||
      !Number.isFinite(startLat) ||
      !Number.isFinite(endLng) ||
      !Number.isFinite(endLat)
    ) {
      return NextResponse.json({ error: "Invalid coordinate values" }, { status: 400 });
    }

    const cacheKey = `${mode}:${startLng.toFixed(5)},${startLat.toFixed(5)}->${endLng.toFixed(5)},${endLat.toFixed(5)}`;
    const cached = memoryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          coordinates: cached.coordinates,
          distanceMeters: cached.distanceMeters,
          durationSeconds: cached.durationSeconds,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        }
      );
    }

    // Try requested profile (foot or driving), fallback to driving if foot fails for long suburban distances
    const profilesToTry = mode === "foot" ? ["foot", "driving"] : ["driving", "foot"];
    let routeFound: { coordinates: [number, number][]; distance: number; duration: number } | null = null;

    for (const profile of profilesToTry) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl, {
          headers: { "User-Agent": "VCCAsset-RealEstateCRM/1.0" },
          next: { revalidate: 86400 },
        });

        if (!res.ok) continue;
        const data = await res.json();
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates as [number, number][] | undefined;

        if (Array.isArray(coords) && coords.length > 1) {
          routeFound = {
            coordinates: coords,
            distance: Math.round(route.distance || 0),
            duration: Math.round(route.duration || 0),
          };
          break;
        }
      } catch {
        // Try next profile
      }
    }

    if (routeFound) {
      memoryCache.set(cacheKey, {
        coordinates: routeFound.coordinates,
        distanceMeters: routeFound.distance,
        durationSeconds: routeFound.duration,
        timestamp: Date.now(),
      });

      return NextResponse.json(
        {
          coordinates: routeFound.coordinates,
          distanceMeters: routeFound.distance,
          durationSeconds: routeFound.duration,
          cached: false,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        }
      );
    }

    // Direct fallback if routing engines are unreachable
    const directCoords: [number, number][] = [
      [startLng, startLat],
      [endLng, endLat],
    ];

    return NextResponse.json({
      coordinates: directCoords,
      distanceMeters: 0,
      durationSeconds: 0,
      fallback: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Route calculation error" }, { status: 500 });
  }
}
