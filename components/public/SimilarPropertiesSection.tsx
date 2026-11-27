import { SimilarPropertiesClient } from "./SimilarPropertiesClient";
import { getPublicProperties } from "@/lib/services/properties";
import { slimPropertyForCard } from "@/lib/utils/slim-property-card";
import { PropertyType } from "@/features/properties/types";
import { unstable_cache } from "next/cache";
import { normalizeProvinceInput } from "@/lib/utils/provinces";
import { getStrictNearbyNeighborhoods } from "@/lib/utils/nearby-areas";

interface SimilarPropertiesSectionProps {
  currentPropertyId: string;
  propertyType?: PropertyType;
  province?: string;
  popularArea?: string | null;
  popularAreaEn?: string | null;
  popularAreaCn?: string | null;
  popularAreaRu?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectNameEn?: string | null;
  listingType?: string | null;
  limit?: number;
  compareData?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
}

function guessProvinceFromArea(area?: string | null): string {
  if (!area) return "กรุงเทพมหานคร";
  const phuketAreas = ["เชิงทะเล", "บางเทา", "ลายัน", "กมลา", "ป่าตอง", "ราไวย์", "ในหาน", "ฉลอง", "เมืองภูเก็ต", "กะทู้", "กะตะ", "กะรน"];
  const chonburiAreas = ["จอมเทียน", "เขาพระตำหนัก", "วงศ์อมาตย์", "พัทยา", "นาจอมเทียน", "พัทยาใต้", "พัทยากลาง", "พัทยาเหนือ", "ศรีราชา", "บางแสน"];
  const lower = area.toLowerCase();
  if (phuketAreas.some((a) => lower.includes(a.toLowerCase()))) return "ภูเก็ต";
  if (chonburiAreas.some((a) => lower.includes(a.toLowerCase()))) return "ชลบุรี";
  return "กรุงเทพมหานคร";
}

/**
 * ⚡ Velocity Shield: Multi-Tier Cached Fetcher for Similar & Project Properties
 * - Tier 1: Same Project (if projectId available)
 * - Tier 2: Same Popular Area & Property Type (strictly within same province)
 * - Tier 3: Same District / Province (strictly within same province)
 * 🛡️ Province Boundary Lock: Under NO circumstances does this query cross province boundaries.
 */
const getCachedSmartSimilarProperties = (
  currentPropertyId: string,
  propertyType?: string,
  province?: string,
  popularArea?: string | null,
  district?: string | null,
  projectId?: string | null,
  limit: number = 4
) =>
  unstable_cache(
    async () => {
      const normProvince = normalizeProvinceInput(province);
      const effectiveProvince =
        normProvince && normProvince !== "ALL"
          ? normProvince
          : guessProvinceFromArea(popularArea);

      type PublicPropertyItem = Awaited<ReturnType<typeof getPublicProperties>>["properties"][number];
      type CollectedSimilarProperty = PublicPropertyItem & {
        matchTier: "same_area" | "nearby_area" | "province";
      };

      const collected: CollectedSimilarProperty[] = [];
      const seenIds = new Set<string>([currentPropertyId]);

      let sameAreaMatchCount = 0;
      let sameAreaHasMore = false;

      // Tier 1: Same Popular Area & Property Type (Distinct developments in same area & province)
      if (popularArea) {
        try {
          const tier1Limit = limit + 8;
          const { properties: areaProps } = await getPublicProperties({
            popular_area: popularArea,
            propertyType: propertyType || undefined,
            province: effectiveProvince,
            limit: tier1Limit,
            includeFacets: false,
          });
          const rawAreaProps = areaProps || [];
          sameAreaHasMore = rawAreaProps.length >= tier1Limit;
          sameAreaMatchCount = rawAreaProps.filter((p) => p.id !== currentPropertyId).length;
          rawAreaProps.forEach((p) => {
            // Skip current property and sibling units of same project to prevent duplicate cards
            if (projectId && p.project_id === projectId) return;
            if (!seenIds.has(p.id) && collected.length < limit) {
              seenIds.add(p.id);
              collected.push({ ...p, matchTier: "same_area" as const });
            }
          });
        } catch (err) {
          console.warn("Error fetching area similar properties:", err);
        }
      }

      // Tier 1.5: True Adjacent Neighborhoods (strictly mapped only — never falsely tags CBD as "nearby" a suburb)
      if (collected.length < limit && popularArea) {
        const nearbyList = getStrictNearbyNeighborhoods(popularArea, effectiveProvince);
        const nearbyNames = nearbyList
          .map((n) => n.name?.trim())
          .filter((n) => Boolean(n) && n !== popularArea.trim());

        if (nearbyNames.length > 0) {
          try {
            const { properties: nearbyProps } = await getPublicProperties({
              popular_area: nearbyNames.join(","),
              propertyType: propertyType || undefined,
              province: effectiveProvince,
              limit: limit + 8,
              includeFacets: false,
            });
            (nearbyProps || []).forEach((p) => {
              if (projectId && p.project_id === projectId) return;
              if (!seenIds.has(p.id) && collected.length < limit) {
                seenIds.add(p.id);
                collected.push({ ...p, matchTier: "nearby_area" as const });
              }
            });
          } catch (err) {
            console.warn("Error fetching nearby neighborhood properties:", err);
          }
        }
      }

      // Tier 2: Same District (Same province strictly enforced)
      if (collected.length < limit && district) {
        try {
          const { properties: districtProps } = await getPublicProperties({
            district,
            propertyType: propertyType || undefined,
            province: effectiveProvince,
            limit: limit + 8,
            includeFacets: false,
          });
          (districtProps || []).forEach((p) => {
            if (projectId && p.project_id === projectId) return;
            if (!seenIds.has(p.id) && collected.length < limit) {
              seenIds.add(p.id);
              collected.push({ ...p, matchTier: "nearby_area" as const });
            }
          });
        } catch (err) {
          console.warn("Error fetching district similar properties:", err);
        }
      }

      // Tier 3: Same Province & Same Property Type (Never cross province boundaries!)
      if (collected.length < limit && propertyType) {
        try {
          const { properties: provinceProps } = await getPublicProperties({
            propertyType: propertyType || undefined,
            province: effectiveProvince,
            limit: limit + 8,
            includeFacets: false,
          });
          (provinceProps || []).forEach((p) => {
            if (projectId && p.project_id === projectId) return;
            if (!seenIds.has(p.id) && collected.length < limit) {
              seenIds.add(p.id);
              collected.push({ ...p, matchTier: "province" as const });
            }
          });
        } catch (err) {
          console.warn("Error fetching province fallback properties:", err);
        }
      }

      return {
        properties: collected.slice(0, limit).map(slimPropertyForCard),
        effectiveProvince,
        sameAreaMatchCount,
        sameAreaHasMore,
      };
    },
    [
      "smart-similar-properties-v7",
      currentPropertyId,
      propertyType || "",
      province || "",
      popularArea || "",
      district || "",
      projectId || "",
      String(limit),
    ],
    { revalidate: 604800, tags: ["properties", `prop-similar-${currentPropertyId}`] }
  )();

/**
 * [S-Tier] Hardened Similar & Nearby Properties Section
 */
export async function SimilarPropertiesSection({
  currentPropertyId,
  propertyType,
  province,
  popularArea,
  district,
  subdistrict,
  projectId,
  projectName,
  projectNameEn,
  popularAreaEn,
  popularAreaCn,
  popularAreaRu,
  listingType,
  limit = 4,
  compareData,
}: SimilarPropertiesSectionProps) {
  if (!propertyType) return null;

  const { properties, effectiveProvince, sameAreaMatchCount, sameAreaHasMore } = await getCachedSmartSimilarProperties(
    currentPropertyId,
    propertyType,
    province || undefined,
    popularArea || undefined,
    district || undefined,
    projectId || undefined,
    limit
  );

  if (!properties || properties.length === 0) {
    return null;
  }

  const hasSameProjectUnits = Boolean(
    projectId && properties.some((p) => p.project_id === projectId)
  );

  return (
    <SimilarPropertiesClient
      properties={properties}
      propertyType={propertyType}
      compareData={compareData}
      projectName={projectName}
      projectNameEn={projectNameEn}
      popularArea={popularArea}
      popularAreaEn={popularAreaEn}
      popularAreaCn={popularAreaCn}
      popularAreaRu={popularAreaRu}
      province={effectiveProvince}
      hasSameProjectUnits={hasSameProjectUnits}
      sameAreaMatchCount={sameAreaMatchCount}
      sameAreaHasMore={sameAreaHasMore}
    />
  );
}
