import { SimilarPropertiesClient } from "./SimilarPropertiesClient";
import { getPublicProperties } from "@/lib/services/properties";
import { PropertyType } from "@/features/properties/types";
import { unstable_cache } from "next/cache";
import { normalizeProvinceInput } from "@/lib/utils/provinces";
import { getNearbyNeighborhoods, type NearbyAreaItem } from "@/lib/utils/nearby-areas";

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

      const collected: any[] = [];
      const seenIds = new Set<string>([currentPropertyId]);

      // Tier 1: Same Popular Area & Property Type (Distinct developments in same area & province)
      if (popularArea) {
        try {
          const { properties: areaProps } = await getPublicProperties({
            popular_area: popularArea,
            propertyType: propertyType as any,
            province: effectiveProvince,
            limit: limit + 8,
          });
          (areaProps || []).forEach((p: any) => {
            // Skip current property and sibling units of same project to prevent duplicate cards
            if (projectId && p.project_id === projectId) return;
            if (!seenIds.has(p.id) && collected.length < limit) {
              seenIds.add(p.id);
              collected.push(p);
            }
          });
        } catch (err) {
          console.warn("Error fetching area similar properties:", err);
        }
      }

      // Tier 2: Same District (Same province strictly enforced)
      if (collected.length < limit && district) {
        try {
          const { properties: districtProps } = await getPublicProperties({
            district,
            propertyType: propertyType as any,
            province: effectiveProvince,
            limit: limit + 8,
          });
          (districtProps || []).forEach((p: any) => {
            if (projectId && p.project_id === projectId) return;
            if (!seenIds.has(p.id) && collected.length < limit) {
              seenIds.add(p.id);
              collected.push(p);
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
            propertyType: propertyType as any,
            province: effectiveProvince,
            limit: limit + 8,
          });
          (provinceProps || []).forEach((p: any) => {
            if (projectId && p.project_id === projectId) return;
            if (!seenIds.has(p.id) && collected.length < limit) {
              seenIds.add(p.id);
              collected.push(p);
            }
          });
        } catch (err) {
          console.warn("Error fetching province fallback properties:", err);
        }
      }

      return {
        properties: collected.slice(0, limit),
        effectiveProvince,
      };
    },
    [
      "smart-similar-properties-v4",
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

  const { properties, effectiveProvince } = await getCachedSmartSimilarProperties(
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
    />
  );
}
