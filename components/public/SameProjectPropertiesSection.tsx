import { SameProjectPropertiesClient } from "./SameProjectPropertiesClient";
import { getPublicProperties } from "@/lib/services/properties";
import { unstable_cache } from "next/cache";

interface SameProjectPropertiesSectionProps {
  currentPropertyId: string;
  projectId?: string | null;
  projectName?: string | null;
  projectNameEn?: string | null;
  projectSlug?: string | null;
  propertyType?: string | null;
  limit?: number;
  compareData?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
}

const getCachedProjectProperties = (
  projectId: string,
  currentPropertyId: string,
  limit: number = 4
) =>
  unstable_cache(
    async () => {
      const { properties } = await getPublicProperties({
        projectId,
        limit: limit + 4, // Buffer to exclude current ID
      });

      const filtered = (properties || [])
        .filter((p) => p.id !== currentPropertyId)
        .slice(0, limit);

      return filtered;
    },
    ["same-project-properties-v2", projectId, currentPropertyId, String(limit)],
    { revalidate: 604800, tags: ["properties", `project-${projectId}`] }
  )();

/**
 * [S-Tier] Hardened Same Project Properties Section
 * Displays sibling units located in the exact same development/condo/housing estate.
 */
export async function SameProjectPropertiesSection({
  currentPropertyId,
  projectId,
  projectName,
  projectNameEn,
  projectSlug,
  propertyType,
  limit = 4,
  compareData,
}: SameProjectPropertiesSectionProps) {
  if (!projectId) return null;

  let properties: any[] = [];
  try {
    properties = await getCachedProjectProperties(
      projectId,
      currentPropertyId,
      limit
    );
  } catch (err) {
    console.warn("Error loading same project properties section:", err);
    return null;
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <SameProjectPropertiesClient
      properties={properties}
      projectName={projectName}
      projectNameEn={projectNameEn}
      projectSlug={projectSlug}
      propertyType={propertyType}
      compareData={compareData}
    />
  );
}
