import { NextResponse } from "next/server";
import { getPublicProperties, GetPropertiesOptions } from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";

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
    } else if (key === "hot_deal") {
      rawParams["filter"] = value === "true" ? "hot_deals" : "all";
    } else if (key === "min_price") {
      rawParams["minPrice"] = Number(value);
    } else if (key === "max_price") {
      rawParams["maxPrice"] = Number(value);
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
      rawParams["province"] = value === "ALL" ? undefined : value;
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
    const items = await getPublicProperties(options);
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API] Failed to load public properties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
