import { NextResponse } from "next/server";
import { getPublicProperties, GetPropertiesOptions } from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";
import { normalizeProvinceInput } from "@/lib/utils/provinces";

/**
 * [S-Tier] High-Velocity Public Properties API
 * - Synchronized with usePropertyFilters URL params
 * - Supports Server-Side Filtering for extreme scalability
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 🔄 Dynamic Mapping to match usePropertyFilters.ts EXACTLY
  const rawParams: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (key === "ids") {
      rawParams[key] = value.split(",").filter(v => v.trim().length > 0);
    } else if (key === "near_train") {
      rawParams["nearTrain"] = value === "true";
    } else if (key === "pet_friendly") {
      rawParams["petFriendly"] = value === "true";
    } else if (key === "fully_furnished") {
      rawParams["fullyFurnished"] = value === "true";
    } else if (key === "foreigner") {
      rawParams["isForeigner"] = value === "true";
    } else if (key === "company_registered") {
      rawParams["companyRegistered"] = value === "true";
    } else if (key === "airbnb" || key === "allow_airbnb") {
      rawParams["allowAirbnb"] = value === "true";
    } else if (key === "luxury_villa") {
      rawParams["luxuryVilla"] = value === "true";
    } else if (key === "cbd") {
      rawParams["cbd"] = value === "true";
    } else if (key === "hot_deal") {
      rawParams["filter"] = value === "true" ? "hot_deals" : "all";
    } else if (key === "min_price") {
      rawParams["minPrice"] = Number(value);
    } else if (key === "max_price") {
      rawParams["maxPrice"] = Number(value);
    } else if (key === "price_type") {
      const pt = value.toUpperCase();
      if (pt === "RENT" || pt === "SALE" || pt === "SALE-RENT") rawParams["priceType"] = pt;
    } else if (key === "min_size") {
      rawParams["minSize"] = Number(value);
    } else if (key === "max_size") {
      rawParams["maxSize"] = Number(value);
    } else if (key === "bedrooms") {
      rawParams["bedrooms"] = value === "ALL" ? undefined : Number(value);
    } else if (key === "listing_type") {
      rawParams["listingType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "property_type") {
      rawParams["propertyType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "popular_area") {
      rawParams["popular_area"] = value === "ALL" ? undefined : value;
    } else if (key === "province") {
      rawParams["province"] = normalizeProvinceInput(value);
    } else if (key === "transit_station") {
      rawParams["transitStation"] = value;
    } else if (key === "keyword") {
      rawParams["q"] = value;
    } else {
      rawParams[key] = value;
    }
  });

  // 🛡️ Validate inputs
  const result = publicPropertyFilterSchema.safeParse(rawParams);
  
  if (!result.success) {
    console.warn("[API] Invalid search params:", result.error.format());
    return NextResponse.json(
      { error: "Invalid search parameters", details: result.error.format() },
      { status: 400 }
    );
  }

  const options = result.data as GetPropertiesOptions;

  try {
    // ⚡ Execute Optimized Server-Side Fetch
    const result = await getPublicProperties(options);

    // 1-year Edge CDN cache for canonical/default pagination URLs explicitly purged on CRUD,
    // 1-hour Edge CDN cache for arbitrary filter combinations that cannot be targeted individually on CF Free/Pro.
    const paramKeys = Array.from(searchParams.keys());
    const isPurgedDefaultQuery =
      paramKeys.length === 0 ||
      (paramKeys.length === 1 &&
        paramKeys[0] === "limit" &&
        ["12", "24", "36", "48"].includes(searchParams.get("limit") || ""));

    const cdnTtl = isPurgedDefaultQuery ? 31536000 : 3600;
    const cdnSwr = isPurgedDefaultQuery ? 31536000 : 86400;

    return NextResponse.json(result, {
      headers: {
        // Browser: 60s cache (fresh quickly after CRUD while preventing redundant reload requests)
        "Cache-Control": `public, max-age=60, s-maxage=${cdnTtl}, stale-while-revalidate=${cdnSwr}`,
        // Vercel Edge CDN: consumes this header and strips s-maxage from Cache-Control downstream
        "Vercel-CDN-Cache-Control": `public, s-maxage=${cdnTtl}, stale-while-revalidate=${cdnSwr}`,
        // Cloudflare Edge CDN (RFC 9213): passed through untouched by Vercel, prioritized over Cache-Control by CF
        "Cloudflare-CDN-Cache-Control": `public, max-age=${cdnTtl}, stale-while-revalidate=${cdnSwr}`,
      },
    });
  } catch (error) {
    console.error("[API] Failed to load public properties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
