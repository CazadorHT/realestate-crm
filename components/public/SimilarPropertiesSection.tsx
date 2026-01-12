import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard } from "./PropertyCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SimilarPropertiesSectionProps {
  currentPropertyId: string;
  propertyType?: string;
  province?: string;
  limit?: number;
}

export async function SimilarPropertiesSection({
  currentPropertyId,
  propertyType,
  province,
  limit = 4,
}: SimilarPropertiesSectionProps) {
  const supabase = createAdminClient();

  if (!propertyType) return null;

  // Build query
  let query = supabase
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
    .eq("property_type", propertyType as any)
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
    <section className="py-12 border-t border-slate-100">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            ทรัพย์สินที่คล้ายกัน
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            อสังหาริมทรัพย์ประเภทเดียกันที่คุณอาจสนใจ
          </p>
        </div>
        <Link
          href={`/properties?type=${propertyType}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          ดูทั้งหมด{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {properties.map((property: any) => {
          const imageUrl =
            property.property_images?.find((img: any) => img.is_cover)
              ?.image_url || property.property_images?.[0]?.image_url;

          return (
            <div key={property.id} className="min-w-0 ">
              <PropertyCard property={{ ...property, image_url: imageUrl }} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
