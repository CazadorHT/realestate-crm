import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard } from "./PropertyCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { MdMapsHomeWork } from "react-icons/md";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { SimilarPropertiesClient } from "./SimilarPropertiesClient";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PropertyType = Database["public"]["Enums"]["property_type"];
type PropertyImage = {
  id: string;
  image_url: string;
  storage_path: string | null;
  is_cover: boolean;
  sort_order: number;
};
type PropertyWithImages = PropertyRow & {
  property_images: PropertyImage[] | null;
  property_features: unknown[] | null;
};

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

export async function SimilarPropertiesSection({
  currentPropertyId,
  propertyType,
  province: _province,
  limit = 4,
  compareData,
}: SimilarPropertiesSectionProps) {
  const supabase = createAdminClient();

  if (!propertyType) return null;

  // Build query
  const query = supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        image_url,
        storage_path,
        is_cover,
        sort_order
      ),
      property_features (
        features (
          id,
          name,
          icon_key,
          category
        )
      )
    `,
    )
    .eq("property_type", propertyType)
    .neq("id", currentPropertyId)
    .eq("status", "ACTIVE") // Ensure only active properties
    .order("created_at", { ascending: false })
    .limit(limit);

  // Optional: Filter by province for better relevance if available
  // if (province) {
  //   query = query.eq("province", province);
  // }
  // NOTE: Relaxing province filter to ensure we get results even if diverse locations.
  // Add it back if database is large enough.

  const { data: properties } = await query;

  if (!properties || properties.length === 0) return null;

  return (
    <SimilarPropertiesClient
      properties={properties as PropertyWithImages[]}
      propertyType={propertyType}
      compareData={compareData}
    />
  );
}
