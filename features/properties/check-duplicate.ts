/**
 * Duplicate check server action
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { findSimilarProperties, type DuplicateCheckData, type DuplicateMatch } from "@/lib/duplicate-detection";

export async function checkDuplicateProperties(
  propertyData: DuplicateCheckData
): Promise<DuplicateMatch[]> {
  const supabase = await createClient();

  // Fetch existing properties with similar criteria
  let query = supabase
    .from("properties")
    .select("id, title, address_line1, district, province, postal_code, price, bedrooms, bathrooms, size_sqm");

  // Narrow down search by province if available
  if (propertyData.province) {
    query = query.eq("province", propertyData.province);
  }

  const { data: properties, error } = await query;

  if (error || !properties) {
    console.error("Error fetching properties for duplicate check:", error);
    return [];
  }

  // Use duplicate detection utility
  const propertiesForCheck = properties.map(p => ({
    ...p,
    address_line1: p.address_line1 ?? undefined,
    district: p.district ?? undefined,
    province: p.province ?? undefined,
    postal_code: p.postal_code ?? undefined,
    price: p.price ?? undefined,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    size_sqm: p.size_sqm ?? undefined,
  }));

  const matches = findSimilarProperties(propertyData, propertiesForCheck, 60);

  return matches;
}
