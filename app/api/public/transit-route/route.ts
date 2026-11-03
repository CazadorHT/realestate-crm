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

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

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
    let bestRoute: { coordinates: [number, number][]; distance: number; duration: number } | null = null;

    const straightDistanceMeters = haversineDistanceMeters(startLat, startLng, endLat, endLng);

    // Bidirectional routing search: In Bangkok, divided dual-carriageway boulevards (like Sukhumvit, Rama 4)
    // often lack pedestrian crosswalk tags in OSM on one side, forcing a forward U-turn detour of 2-5 km.
    // Querying both Forward (start -> end) and Reverse (end -> start) in parallel guarantees finding
    // the direct street route (e.g. 335m directly down Sukhumvit instead of 2.6km U-turn to Asok)!
    for (const profile of profilesToTry) {
      try {
        const fwdUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const revUrl = `https://router.project-osrm.org/route/v1/${profile}/${endLng},${endLat};${startLng},${startLat}?overview=full&geometries=geojson`;

        const [fwdRes, revRes] = await Promise.all([
          fetch(fwdUrl, {
            headers: { "User-Agent": "VCCAsset-RealEstateCRM/1.0" },
            next: { revalidate: 86400 },
          }).catch(() => null),
          fetch(revUrl, {
            headers: { "User-Agent": "VCCAsset-RealEstateCRM/1.0" },
            next: { revalidate: 86400 },
          }).catch(() => null),
        ]);

        const fwdData = fwdRes?.ok ? await fwdRes.json().catch(() => null) : null;
        const revData = revRes?.ok ? await revRes.json().catch(() => null) : null;

        const fwdRoute = fwdData?.routes?.[0];
        const revRoute = revData?.routes?.[0];

        const candidates: {
          coordinates: [number, number][];
          distance: number;
          duration: number;
        }[] = [];

        if (
          Array.isArray(fwdRoute?.geometry?.coordinates) &&
          fwdRoute.geometry.coordinates.length > 1
        ) {
          candidates.push({
            coordinates: fwdRoute.geometry.coordinates,
            distance: Math.round(fwdRoute.distance || 0),
            duration: Math.round(fwdRoute.duration || 0),
          });
        }

        if (
          Array.isArray(revRoute?.geometry?.coordinates) &&
          revRoute.geometry.coordinates.length > 1
        ) {
          // Reverse route coordinates to match start -> end order
          candidates.push({
            coordinates: revRoute.geometry.coordinates.slice().reverse(),
            distance: Math.round(revRoute.distance || 0),
            duration: Math.round(revRoute.duration || 0),
          });
        }

        // Sort candidates by shortest distance
        candidates.sort((a, b) => a.distance - b.distance);

        for (const cand of candidates) {
          // Detour circuity guard: reject absurd loop detours (> 1.85x straight line)
          const isDetour =
            (straightDistanceMeters <= 1000 &&
              (cand.distance > straightDistanceMeters * 1.85 ||
                cand.distance - straightDistanceMeters > 500)) ||
            (straightDistanceMeters > 1000 &&
              cand.distance > straightDistanceMeters * 2.3);

          if (!isDetour) {
            bestRoute = cand;
            break;
          }
        }

        if (bestRoute) break;
      } catch {
        // Try next profile
      }
    }

    if (bestRoute) {
      memoryCache.set(cacheKey, {
        coordinates: bestRoute.coordinates,
        distanceMeters: bestRoute.distance,
        durationSeconds: bestRoute.duration,
        timestamp: Date.now(),
      });

      return NextResponse.json(
        {
          coordinates: bestRoute.coordinates,
          distanceMeters: bestRoute.distance,
          durationSeconds: bestRoute.duration,
          cached: false,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        }
      );
    }

    // Direct fallback if routing engines are unreachable or detour was rejected
    const directCoords: [number, number][] = [
      [startLng, startLat],
      [endLng, endLat],
    ];

    const fallbackEntry = {
      coordinates: directCoords,
      distanceMeters: straightDistanceMeters,
      durationSeconds: Math.round(straightDistanceMeters / 1.4),
      timestamp: Date.now(),
    };

    memoryCache.set(cacheKey, fallbackEntry);

    return NextResponse.json(fallbackEntry, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Route calculation error" }, { status: 500 });
  }
}
