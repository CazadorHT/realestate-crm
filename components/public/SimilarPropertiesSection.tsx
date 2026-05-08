import { SimilarPropertiesClient } from "./SimilarPropertiesClient";
import { getPublicProperties } from "@/lib/services/properties";
import { PropertyType } from "@/features/properties/types";
import { unstable_cache } from "next/cache";
import { PropertyCardProps } from "./PropertyCard";

interface SimilarPropertiesSectionProps {
  currentPropertyId: string;
  propertyType?: PropertyType;
  province?: string;
  limit?: number;
  compareData?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
}

/**
 * ⚡ Velocity Shield: Cached Fetcher for Similar Properties
 * Stores results for 1 hour to maximize discovery performance.
 */
const getCachedSimilarProperties = unstable_cache(
  async (propertyType: string, province?: string, limit: number = 4) => {
    return getPublicProperties({
      propertyType: propertyType as any,
      listingType: "ALL",
      limit: limit + 4, // Fetch buffer for filtering current ID
      province: province,
    });
  },
  ["similar-properties-cache"],
  { revalidate: 3600, tags: ["properties"] },
);

/**
 * [S-Tier] Hardened Similar Properties Section
 * - Dual-Layer Caching (Global 1h + Request Memoization)
 * - Security Whitelisted Columns
 * - Fallback Discovery Logic
 */
export async function SimilarPropertiesSection({
  currentPropertyId,
  propertyType,
  province,
  limit = 4,
  compareData,
}: SimilarPropertiesSectionProps) {
  if (!propertyType) return null;

  // 🛡️ Security Seal: Use the hardened cached fetcher
  const { properties } = await getCachedSimilarProperties(
    propertyType,
    province || undefined,
    limit,
  );

  // Filter out the current property and limit results
  const filteredProperties = (properties || [])
    .filter((p) => p.id !== currentPropertyId)
    .slice(0, limit);

  if (filteredProperties.length === 0) {
    // 🧠 Discovery Fallback: Try global similar by type if local fails
    if (province) {
      const { properties: globalProperties } = await getCachedSimilarProperties(
        propertyType,
        undefined,
        limit,
      );
      const filteredFallback = (globalProperties || [])
        .filter((p) => p.id !== currentPropertyId)
        .slice(0, limit);

      if (filteredFallback.length > 0) {
        return (
          <SimilarPropertiesClient
            properties={filteredFallback}
            propertyType={propertyType}
            compareData={compareData}
          />
        );
      }
    }
    return null;
  }

  return (
    <SimilarPropertiesClient
      properties={filteredProperties}
      propertyType={propertyType}
      compareData={compareData}
    />
  );
}
