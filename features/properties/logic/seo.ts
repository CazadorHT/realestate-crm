import { PropertyFormValues } from "../schema";
import { generatePropertySEO, PropertyDataForSEO } from "@/lib/seo-utils";
import { Database } from "@/lib/database.types";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

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
  propertyData: Record<string, unknown>,
  safeValues: PropertyFormValues,
  language: string = "th",
) {
  return generatePropertySEO(
    {
      id: propertyData.id as string | undefined,
      slug: propertyData.slug as string | undefined,
      title: propertyData.title as string,
      title_en: propertyData.title_en as string | undefined,
      title_cn: propertyData.title_cn as string | undefined,
      title_ru: propertyData.title_ru as string | undefined,
      property_type: propertyData.property_type as PropertyType,
      listing_type: propertyData.listing_type as ListingType,
      bedrooms: (propertyData.bedrooms as number) ?? undefined,
      bathrooms: (propertyData.bathrooms as number) ?? undefined,
      size_sqm: (propertyData.size_sqm as number) ?? undefined,
      price: (propertyData.price as number) ?? undefined,
      original_price: (propertyData.original_price as number) ?? undefined,
      rental_price: (propertyData.rental_price as number) ?? undefined,
      original_rental_price: (propertyData.original_rental_price as number) ?? undefined,
      popular_area: propertyData.popular_area as string | undefined,
      popular_area_en: propertyData.popular_area_en as string | undefined,
      popular_area_cn: propertyData.popular_area_cn as string | undefined,
      popular_area_ru: propertyData.popular_area_ru as string | undefined,
      subdistrict: propertyData.subdistrict as string | undefined,
      subdistrict_en: propertyData.subdistrict_en as string | undefined,
      subdistrict_cn: propertyData.subdistrict_cn as string | undefined,
      subdistrict_ru: propertyData.subdistrict_ru as string | undefined,
      district: propertyData.district as string | undefined,
      district_en: propertyData.district_en as string | undefined,
      district_cn: propertyData.district_cn as string | undefined,
      district_ru: propertyData.district_ru as string | undefined,
      province: propertyData.province as string | undefined,
      province_en: propertyData.province_en as string | undefined,
      province_cn: propertyData.province_cn as string | undefined,
      province_ru: propertyData.province_ru as string | undefined,
      address_line1: propertyData.address_line1 as string | undefined,
      address_line1_en: propertyData.address_line1_en as string | undefined,
      address_line1_cn: propertyData.address_line1_cn as string | undefined,
      address_line1_ru: propertyData.address_line1_ru as string | undefined,
      postal_code: propertyData.postal_code as string | undefined,
      description: propertyData.description as string | undefined,
      description_en: propertyData.description_en as string | undefined,
      description_cn: propertyData.description_cn as string | undefined,
      description_ru: propertyData.description_ru as string | undefined,
      transit_station_name: propertyData.transit_station_name as string | undefined,
      transit_station_name_en: propertyData.transit_station_name_en as string | undefined,
      transit_station_name_cn: propertyData.transit_station_name_cn as string | undefined,
      transit_station_name_ru: propertyData.transit_station_name_ru as string | undefined,
      // SEO Flags
      is_pet_friendly: !!propertyData.is_pet_friendly,
      is_corner_unit: !!propertyData.is_corner_unit,
      is_renovated: !!propertyData.is_renovated,
      is_fully_furnished: !!propertyData.is_fully_furnished,
      is_selling_with_tenant: !!propertyData.is_selling_with_tenant,
      is_foreigner_quota: !!propertyData.is_foreigner_quota,
      is_hot_sale: !!(
        (Number(propertyData.original_price || 0) > 0 &&
          Number(propertyData.price || 0) > 0 &&
          Number(propertyData.original_price) > Number(propertyData.price)) ||
        (Number(propertyData.original_rental_price || 0) > 0 &&
          Number(propertyData.rental_price || 0) > 0 &&
          Number(propertyData.original_rental_price) > Number(propertyData.rental_price))
      ),
      near_transit: !!(
        ((propertyData.nearby_transits as unknown[])?.length || 0) > 0 ||
        !!propertyData.near_transit
      ),
      nearby_transits: (propertyData.nearby_transits as any) || [],
      nearby_places: (propertyData.nearby_places as any) || [],
      features: (propertyData.features as string[]) || [],
      main_image: (propertyData.main_image as string) || undefined,
    },
    language,
  );
}
