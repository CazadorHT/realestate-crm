import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { getSafeImages, getSafeNearbyTransits } from "@/lib/property-hardened-utils";
import { getPopularAreasLookupMap } from "@/features/public/popular-areas";
import { getMasterTransitStationsList } from "@/features/public/stations";
import { BANGKOK_TRANSIT_STATION_COORDS } from "@/lib/constants/bangkok-transit-coords";
import {
  isWithinThailandBounds,
  parseCoordinatesFromUrlSync,
} from "@/lib/utils/google-maps-coords";
import type { PropertyCardProps } from "@/components/public/PropertyCard";

export interface SlimMapPin extends PropertyCardProps {
  latitude: number;
  longitude: number;
  project_id?: string | null;
  project_image_url?: string | null;
  project_name_cn?: string | null;
  project_name_ru?: string | null;
  amenities?: Record<string, any> | null;
}

export interface MapTransitStation {
  code: string;
  slug: string;
  transitType: string;
  lineColor: string;
  latitude: number;
  longitude: number;
  label: {
    th: string;
    en: string;
    cn?: string;
    ru?: string;
  };
}

export interface MapPinsPayload {
  pins: SlimMapPin[];
  stations: MapTransitStation[];
  generatedAt: number;
}

const LINE_COLORS: Record<string, string> = {
  BTS: "#7BC542",
  MRT: "#1E3A8A",
  MRT_PURPLE: "#7C3AED",
  MRT_YELLOW: "#F59E0B",
  MRT_PINK: "#EC4899",
  MRT_ORANGE: "#F97316",
  ARL: "#DC2626",
  SRT_RED: "#EF4444",
  GOLD: "#D97706",
  BRT: "#059669",
};

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

// Slim column list: excludes long 4-language descriptions, full feature joins, AI summaries, and metadata blobs
const SLIM_MAP_COLUMNS = `
  id, slug, title, title_en, title_cn, title_ru, project_id,
  property_type, listing_type,
  price, rental_price, original_price, original_rental_price,
  price_per_sqm, rent_price_per_sqm,
  verified, min_contract_months, bedrooms, bathrooms,
  size_sqm, land_size_sqwah, parking_slots, floor,
  created_at, updated_at,
  popular_area, popular_area_en, popular_area_cn, popular_area_ru,
  province, district, subdistrict,
  address_line1, address_line1_en, address_line1_cn, address_line1_ru,
  address_info, google_maps_link,
  nearby_transits, is_hot_deal,
  near_transit, transit_type, transit_station_name,
  transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_distance_meters,
  is_fully_furnished, is_pet_friendly, is_foreigner_quota, is_tax_registered,
  amenities, images,
  property_images (
    image_url, storage_path, is_cover, sort_order
  )
`;

import {
  getMapPinsMemoryCache,
  invalidateMapPinsMemoryCache,
  setMapPinsMemoryCache,
} from "./map-pins-memory";

export { invalidateMapPinsMemoryCache };

function pickSingleCoverImage(
  propertyImages: any[] | null | undefined,
  legacyImages: unknown,
  projectImageUrl: string | null
): string {
  if (Array.isArray(propertyImages) && propertyImages.length > 0) {
    const sorted = [...propertyImages].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    });
    const best = sorted[0];
    const rawTarget = best?.image_url || best?.storage_path || "";
    if (rawTarget) {
      const resolved = getPublicImageUrl(rawTarget);
      if (resolved) return resolved;
    }
  }

  const safeLegacy = getSafeImages(legacyImages);
  const coverLegacy = safeLegacy.find((img) => img.is_cover) || safeLegacy[0];
  if (coverLegacy?.url) {
    return coverLegacy.url;
  }

  // Fallback to Condo Project hero photo if unit has no uploaded photo yet
  if (projectImageUrl) {
    return getPublicImageUrl(projectImageUrl) || DEFAULT_FALLBACK_IMAGE;
  }

  return DEFAULT_FALLBACK_IMAGE;
}

const fetchCachedMapPinsPayload = unstable_cache(
  async (): Promise<MapPinsPayload> => {
    const supabase = createPublicClient();

    // 1. Fetch all active properties using range(0, 4999) to bypass PostgREST's 1,000-row silent truncation
    const { data: rows, error } = await supabase
      .from("properties")
      .select(SLIM_MAP_COLUMNS)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .range(0, 4999);

    if (error) {
      if (process.env.NEXT_PHASE === "phase-production-build") {
        return { pins: [], stations: [], generatedAt: Date.now() };
      }
      throw new Error(`Failed to fetch map pins: ${error.message}`);
    }

    const rawRows = (rows || []) as any[];

    // 2. Batch-fetch referenced projects once
    const projectIds = Array.from(
      new Set(
        rawRows
          .map((r) => r.project_id)
          .filter((id: string | null | undefined): id is string => !!id)
      )
    );

    const projectMap = new Map<
      string,
      {
        name_th: string | null;
        name_en: string | null;
        name_cn: string | null;
        name_ru: string | null;
        slug: string | null;
        latitude: number | null;
        longitude: number | null;
        image_url: string | null;
      }
    >();

    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, slug, latitude, longitude, image_url")
        .in("id", projectIds);

      (projectsData || []).forEach((p: any) => {
        if (!p?.id) return;
        const n = p.name;
        const nameTh =
          typeof n === "object" && n !== null
            ? n.th || n.name_th || null
            : typeof n === "string"
              ? n
              : null;
        const nameEn =
          typeof n === "object" && n !== null ? n.en || n.name_en || null : null;
        const nameCn =
          typeof n === "object" && n !== null ? n.cn || null : null;
        const nameRu =
          typeof n === "object" && n !== null ? n.ru || null : null;

        projectMap.set(p.id, {
          name_th: nameTh,
          name_en: nameEn,
          name_cn: nameCn,
          name_ru: nameRu,
          slug: p.slug || null,
          latitude: typeof p.latitude === "number" ? p.latitude : null,
          longitude: typeof p.longitude === "number" ? p.longitude : null,
          image_url: p.image_url || null,
        });
      });
    }

    // 3. Popular area multilingual lookup (shared cached map)
    let areaLookup: Record<string, any> = {};
    try {
      areaLookup = await getPopularAreasLookupMap();
    } catch {
      areaLookup = {};
    }

    // 4. Build SlimMapPin items (strictly filtered to valid Thailand coordinates)
    const pins: SlimMapPin[] = [];

    for (const row of rawRows) {
      const proj = row.project_id ? projectMap.get(row.project_id) : null;
      const addrInfo = (row.address_info || {}) as Record<string, any>;

      // Priority 1: Project coordinates -> Priority 2: Property address_info coordinates -> Priority 3: Inline sync parse
      let lat: number | null = null;
      let lng: number | null = null;

      if (
        proj &&
        proj.latitude != null &&
        proj.longitude != null &&
        isWithinThailandBounds(proj.latitude, proj.longitude)
      ) {
        lat = proj.latitude;
        lng = proj.longitude;
      } else if (
        typeof addrInfo.latitude === "number" &&
        typeof addrInfo.longitude === "number" &&
        isWithinThailandBounds(addrInfo.latitude, addrInfo.longitude)
      ) {
        lat = addrInfo.latitude;
        lng = addrInfo.longitude;
      } else {
        const syncParsed = parseCoordinatesFromUrlSync(
          row.google_maps_link || addrInfo.maps_link
        );
        if (syncParsed) {
          lat = syncParsed.lat;
          lng = syncParsed.lng;
        }
      }

      if (lat == null || lng == null || !isWithinThailandBounds(lat, lng)) {
        continue;
      }

      const areaKey = (row.popular_area || "").trim().toLowerCase();
      const areaTrans = areaKey ? areaLookup[areaKey] : undefined;

      const projectImageUrl = proj?.image_url
        ? getPublicImageUrl(proj.image_url)
        : null;
      const coverUrl = pickSingleCoverImage(
        row.property_images,
        row.images,
        proj?.image_url || null
      );

      const amenitiesObj = (row.amenities || {}) as Record<string, any>;
      const createTime = row.created_at ? new Date(row.created_at).getTime() : 0;
      const updateTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;

      const locationParts = [
        row.address_line1,
        row.subdistrict,
        row.district,
        row.province,
      ].filter(Boolean);

      const parsedFloor =
        row.floor != null
          ? Number(row.floor)
          : amenitiesObj.floor != null && !isNaN(Number(amenitiesObj.floor))
            ? Number(amenitiesObj.floor)
            : null;

      const parsedParking =
        row.parking_slots != null
          ? Number(row.parking_slots)
          : amenitiesObj.parking_slots != null &&
              !isNaN(Number(amenitiesObj.parking_slots))
            ? Number(amenitiesObj.parking_slots)
            : null;

      pins.push({
        id: row.id,
        slug: row.slug,
        title: row.title || "",
        title_en: row.title_en || null,
        title_cn: row.title_cn || null,
        title_ru: row.title_ru || null,
        property_type: row.property_type || null,
        listing_type: row.listing_type || null,
        price: row.price ?? null,
        rental_price: row.rental_price ?? null,
        original_price: row.original_price ?? null,
        original_rental_price: row.original_rental_price ?? null,
        price_per_sqm: row.price_per_sqm ?? null,
        rent_price_per_sqm: row.rent_price_per_sqm ?? null,
        bedrooms: row.bedrooms ?? null,
        bathrooms: row.bathrooms ?? null,
        size_sqm: row.size_sqm ?? null,
        land_size_sqwah: row.land_size_sqwah ?? null,
        parking_slots: parsedParking,
        floor: parsedFloor,
        province: row.province || null,
        popular_area: row.popular_area || null,
        popular_area_en: row.popular_area_en || areaTrans?.en || null,
        popular_area_cn: row.popular_area_cn || areaTrans?.cn || null,
        popular_area_ru: row.popular_area_ru || areaTrans?.ru || null,
        popular_area_slug: areaTrans?.slug || null,
        project_id: row.project_id || null,
        project_name: proj?.name_th || proj?.name_en || null,
        project_slug: proj?.slug || null,
        project_image_url: projectImageUrl,
        project_name_cn: proj?.name_cn || null,
        project_name_ru: proj?.name_ru || null,
        projects: proj
          ? {
              name_th: proj.name_th,
              name_en: proj.name_en,
              slug: proj.slug,
            }
          : null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_at_time: Math.max(createTime, updateTime),
        image_url: coverUrl,
        images: [{ url: coverUrl }],
        location: locationParts.length > 0 ? locationParts.join(", ") : null,
        verified:
          row.verified === true ? true : row.verified === false ? false : undefined,
        min_contract_months: row.min_contract_months ?? null,
        near_transit: row.near_transit ?? null,
        transit_type: row.transit_type ?? null,
        transit_station_name: row.transit_station_name ?? null,
        transit_station_name_en: row.transit_station_name_en ?? null,
        transit_station_name_cn: row.transit_station_name_cn ?? null,
        transit_station_name_ru: row.transit_station_name_ru ?? null,
        transit_distance_meters: row.transit_distance_meters ?? null,
        is_fully_furnished: row.is_fully_furnished ?? null,
        is_pet_friendly: row.is_pet_friendly ?? null,
        is_foreigner_quota: row.is_foreigner_quota ?? null,
        is_tax_registered: row.is_tax_registered ?? null,
        is_hot_deal: row.is_hot_deal ?? null,
        allow_airbnb: !!amenitiesObj.allow_airbnb,
        is_cbd: typeof amenitiesObj.is_cbd === "boolean" ? amenitiesObj.is_cbd : null,
        airbnb_daily_price: amenitiesObj.airbnb_daily_price ?? null,
        airbnb_monthly_price: amenitiesObj.airbnb_monthly_price ?? null,
        amenities: amenitiesObj,
        nearby_transits: getSafeNearbyTransits(row.nearby_transits),
        latitude: lat,
        longitude: lng,
      });
    }

    // 5. Extract Transit Stations with valid coordinates from cached master list (+ static Bangkok fallback)
    const stations: MapTransitStation[] = [];
    const seenStationCoords = new Set<string>();
    try {
      const masterStations = await getMasterTransitStationsList();
      for (const item of masterStations || []) {
        const meta = (item.metadata || {}) as Record<string, any>;
        const rawLat =
          meta.latitude != null && meta.latitude !== ""
            ? Number(meta.latitude)
            : NaN;
        const rawLng =
          meta.longitude != null && meta.longitude !== ""
            ? Number(meta.longitude)
            : NaN;

        const fallbackCoord =
          BANGKOK_TRANSIT_STATION_COORDS[item.code.toLowerCase()];

        const lat = Number.isFinite(rawLat)
          ? rawLat
          : fallbackCoord
            ? fallbackCoord[0]
            : NaN;
        const lng = Number.isFinite(rawLng)
          ? rawLng
          : fallbackCoord
            ? fallbackCoord[1]
            : NaN;

        if (!isWithinThailandBounds(lat, lng)) continue;

        const transitType = (meta.transit_type as string) || "BTS";
        // Deduplicate duplicate alias rows in ref_master_data (e.g. mrt_phawana & mrt_yellow_phawana)
        const dedupKey = `${transitType}:${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (seenStationCoords.has(dedupKey)) continue;
        seenStationCoords.add(dedupKey);

        const labelObj = (item.label || {}) as Record<string, string>;
        const lineColor =
          (meta.line_color as string) || LINE_COLORS[transitType] || "#2563EB";
        const slug =
          (meta.slug as string) || item.code.toLowerCase().replace(/_/g, "-");

        stations.push({
          code: item.code,
          slug,
          transitType,
          lineColor,
          latitude: lat,
          longitude: lng,
          label: {
            th: labelObj.th || item.code,
            en: labelObj.en || labelObj.th || item.code,
            cn: labelObj.cn || labelObj.en || labelObj.th,
            ru: labelObj.ru || labelObj.en || labelObj.th,
          },
        });
      }
    } catch {
      // Non-fatal if station master list is unavailable
    }

    return {
      pins,
      stations,
      generatedAt: Date.now(),
    };
  },
  ["public-map-pins-v3"],
  {
    revalidate: 31536000, // 1 year cache (purged on-demand via revalidatePropertyPublicCache)
    tags: ["properties", "public-data", "public-properties", "projects", "transit-stations"],
  }
);

export const getPublicMapPins = cache(async (): Promise<MapPinsPayload> => {
  const cached = getMapPinsMemoryCache();
  if (cached) {
    return cached;
  }
  const payload = await fetchCachedMapPinsPayload();
  setMapPinsMemoryCache(payload);
  return payload;
});
