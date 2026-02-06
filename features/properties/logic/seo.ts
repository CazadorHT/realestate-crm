import { PropertyFormValues } from "../schema";
import { generatePropertySEO } from "@/lib/seo-utils";

export function generateKeywords(
  safeValues: PropertyFormValues,
  currentKeywords: string[] = [],
): string[] {
  // Creating a set from current keywords to avoid duplicates easily
  let finalKeywords = [...currentKeywords];

  const toggleKeyword = (condition: boolean | undefined | null, kw: string) => {
    if (condition) {
      if (!finalKeywords.includes(kw)) finalKeywords.push(kw);
    } else {
      finalKeywords = finalKeywords.filter((k) => k !== kw);
    }
  };

  toggleKeyword(safeValues.is_pet_friendly, "Pet Friendly");
  toggleKeyword(safeValues.is_foreigner_quota, "Foreigner Friendly");
  toggleKeyword(safeValues.allow_smoking, "Smoking Allowed");
  toggleKeyword(safeValues.is_renovated, "Renovated");
  toggleKeyword(safeValues.is_fully_furnished, "Fully Furnished");
  toggleKeyword(safeValues.is_corner_unit, "Corner Unit");
  toggleKeyword(safeValues.has_private_pool, "Private Pool");
  toggleKeyword(safeValues.is_selling_with_tenant, "Selling with Tenant");

  toggleKeyword(safeValues.has_garden_view, "Garden View");
  toggleKeyword(safeValues.has_pool_view, "Pool View");
  toggleKeyword(safeValues.has_city_view, "City View");
  toggleKeyword(safeValues.has_unblocked_view, "Unblocked View");
  toggleKeyword(safeValues.has_river_view, "River View");
  toggleKeyword(safeValues.facing_east, "East Facing");
  toggleKeyword(safeValues.facing_north, "North Facing");
  toggleKeyword(safeValues.facing_south, "South Facing");
  toggleKeyword(safeValues.facing_west, "West Facing");
  toggleKeyword(safeValues.is_high_ceiling, "High Ceiling");
  toggleKeyword(safeValues.has_multi_parking, "Multi-Parking");
  toggleKeyword(safeValues.is_grade_a, "Grade A Building");
  toggleKeyword(safeValues.is_grade_b, "Grade B Building");
  toggleKeyword(safeValues.is_grade_c, "Grade C Building");
  toggleKeyword(safeValues.is_column_free, "Column-Free");
  toggleKeyword(safeValues.is_central_air, "Central Air-con");
  toggleKeyword(safeValues.is_split_air, "Split Air-con");
  toggleKeyword(safeValues.has_247_access, "24/7 Access");
  toggleKeyword(safeValues.has_fiber_optic, "High-Speed Fiber Optic");
  toggleKeyword(safeValues.is_tax_registered, "Tax Registered");

  if (safeValues.ceiling_height) {
    // Remove old dynamic keyword if exists (partial match assumption might be risky if format changes, but okay for now)
    finalKeywords = finalKeywords.filter((k) => !k.startsWith("High Ceiling "));
    finalKeywords.push(`High Ceiling ${safeValues.ceiling_height}m`);
  }
  if (safeValues.orientation) {
    finalKeywords = finalKeywords.filter((k) => !k.startsWith("Facing "));
    finalKeywords.push(`Facing ${safeValues.orientation}`);
  }
  if (safeValues.parking_type) {
    finalKeywords = finalKeywords.filter((k) => !k.endsWith(" Parking"));
    finalKeywords.push(`${safeValues.parking_type} Parking`);
  }

  return finalKeywords;
}

export function prepareSEOData(
  propertyData: any, // using any for simplicity as it mirrors duplicate huge object logic
  safeValues: PropertyFormValues,
) {
  return generatePropertySEO({
    title: propertyData.title,
    property_type: propertyData.property_type,
    listing_type: propertyData.listing_type,
    bedrooms: propertyData.bedrooms ?? undefined,
    bathrooms: propertyData.bathrooms ?? undefined,
    size_sqm: propertyData.size_sqm ?? undefined,
    price: propertyData.price ?? undefined,
    rental_price: propertyData.rental_price ?? undefined,
    popular_area: propertyData.popular_area ?? undefined,
    subdistrict: propertyData.subdistrict ?? undefined,
    district: propertyData.district ?? undefined,
    province: propertyData.province ?? undefined,
    address_line1: propertyData.address_line1 ?? undefined,
    postal_code: propertyData.postal_code ?? undefined,
    description: propertyData.description ?? undefined,
    transit_station_name: (propertyData as any).transit_station_name,
    nearby_transits: (propertyData as any).nearby_transits,
    // SEO Flags
    is_pet_friendly: !!propertyData.is_pet_friendly,
    is_corner_unit: !!propertyData.is_corner_unit,
    is_renovated: !!propertyData.is_renovated,
    is_fully_furnished: !!propertyData.is_fully_furnished,
    is_selling_with_tenant: !!propertyData.is_selling_with_tenant,
    is_foreigner_quota: !!propertyData.is_foreigner_quota,
    is_hot_sale: !!(
      (propertyData.original_price &&
        propertyData.price &&
        propertyData.original_price > propertyData.price) ||
      (propertyData.original_rental_price &&
        propertyData.rental_price &&
        propertyData.original_rental_price > propertyData.rental_price)
    ),
    near_transit: !!(
      ((propertyData.nearby_transits as any[])?.length || 0) > 0 ||
      (propertyData as any).near_transit
    ),
    nearby_places: (propertyData as any).nearby_places || [],
    features: (propertyData as any).features || [],
  });
}
