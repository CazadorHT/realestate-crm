import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard } from "./PropertyCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Database } from "@/lib/database.types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PropertyType = Database["public"]["Enums"]["property_type"];
type PropertyImage = {
  id: string;
  image_url: string;
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
}

export async function SimilarPropertiesSection({
  currentPropertyId,
  propertyType,
  province: _province,
  limit = 4,
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
    `
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
    <section className="py-8 md:py-12 border-t border-slate-100">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            ทรัพย์สินที่คล้ายกัน
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            อสังหาริมทรัพย์ประเภทเดียกันที่คุณอาจสนใจ
          </p>
        </div>
        <Link
          href={`/properties?type=${propertyType}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start md:self-auto"
        >
          ดูทั้งหมด{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {(properties as PropertyWithImages[]).map((property) => {
          const imageUrl =
            property.property_images?.find((img) => img.is_cover)?.image_url ||
            property.property_images?.[0]?.image_url;

          return (
            <div key={property.id} className="min-w-0 ">
              <PropertyCard
                property={{
                  ...property,
                  image_url: imageUrl,
                  verified: property.verified ?? undefined,
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
