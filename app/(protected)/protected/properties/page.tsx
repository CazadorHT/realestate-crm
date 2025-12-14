import { createClient } from "@/lib/supabase/server";
import {
  PropertiesTable,
  PropertyTableData,
} from "@/components/properties/PropertiesTable";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/database.types";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { ImageLightbox } from "@/components/properties/ImageLightbox"; 



export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    listing?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    province?: string;
    district?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const {
    q,
    status,
    type,
    listing,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    province,
    district,
    sortBy = "created_at",
    sortOrder = "desc",
    page,
  } = params;

  // Pagination Config
  const PAGE_SIZE = 10;
  const currentPage = Number(page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 1. Build Query
  let query = supabase
    .from("properties")
    .select("*",   { count: "exact" }) // Get count for pagination
    .range(from, to);

  // Search
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,address_line1.ilike.%${q}%`
    );
  }

  // Filters
  if (status) {
    query = query.eq("status", status as any);
  }
  if (type) {
    query = query.eq("property_type", type as any);
  }
  if (listing) {
    query = query.eq("listing_type", listing as any);
  }
  if (bedrooms) {
    query = query.eq("bedrooms", Number(bedrooms));
  }
  if (bathrooms) {
    query = query.eq("bathrooms", Number(bathrooms));
  }
  if (province) {
    query = query.ilike("province", `%${province}%`);
  }
  if (district) {
    query = query.ilike("district", `%${district}%`);
  }

  // Price Range
  if (minPrice) {
    query = query.gte("price", Number(minPrice));
  }
  if (maxPrice) {
    query = query.lte("price", Number(maxPrice));
  }

  // Sorting
  const validSortFields = [
    "created_at",
    "updated_at",
    "title",
    "price",
    "bedrooms",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
  const ascending = sortOrder === "asc";

  query = query.order(sortField, { ascending });

  const { data: properties, error, count } = await query;

  if (error || !properties) {
    console.error("Error fetching properties:", error);
    return (
      <div className="p-8 text-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    );
  }

  const propertyIds = properties.map((p) => p.id);
  const assignedToIds = properties
    .map((p) => p.assigned_to)
    .filter(Boolean) as string[];

  // 2. Fetch Associations in Parallel
  const [imagesResult, leadsResult, profilesResult] = await Promise.all([
    // Images: Get cover images for these properties
    supabase
      .from("property_images")
      .select("property_id, image_url")
      .in("property_id", propertyIds)
      .eq("is_cover", true),

    // Leads: Get leads to count them (Optimized: just fetching ID)
    supabase.from("leads").select("property_id").in("property_id", propertyIds),

    // Profiles: Get names for assigned agents
    assignedToIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", assignedToIds)
      : Promise.resolve({ data: [] }),
  ]);

  // 3. Map Data
  const coverMap = new Map(
    imagesResult.data?.map((img) => [img.property_id, img.image_url])
  );

  // Count leads per property
  const leadsCountMap = new Map<string, number>();
  leadsResult.data?.forEach((lead) => {
    if (lead.property_id) {
      leadsCountMap.set(
        lead.property_id,
        (leadsCountMap.get(lead.property_id) || 0) + 1
      );
    }
  });

  // Map profile names
  const profileMap = new Map(
    (profilesResult.data as any[])?.map((p) => [p.id, p.full_name]) || []
  );

  // 4. Transform to Table Data
  const tableData: PropertyTableData[] = properties.map((p) => {
    // Logic for Price Display
    // If listing_type is BOTH, we might prefer showing Price, or handle in Table component.
    // The Table Component handles display logic based on availability.

    // Check "New" status (Created < 7 days)
    const isNew =
      new Date().getTime() - new Date(p.created_at).getTime() <
      7 * 24 * 60 * 60 * 1000;

    return {
      id: p.id,
      title: p.title,
      description: p.description, // using district/province if available in future, now description
      image_url: coverMap.get(p.id) || null,
      property_type: p.property_type,
      listing_type: p.listing_type,
      price: p.price,
      rental_price: p.rental_price,
      status: p.status,
      leads_count: leadsCountMap.get(p.id) || 0,
      updated_at: p.updated_at,
      created_at: p.created_at,
      agent_name: p.assigned_to ? profileMap.get(p.assigned_to) : null,
      is_new: isNew,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ทรัพย์ทั้งหมด ({count || 0})</h1>
          <p className="text-muted-foreground">
            จัดการและติดตามทรัพย์สินของคุณ
          </p>
        </div>
        <Button asChild>
          <Link href="/protected/properties/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            เพิ่มทรัพย์
          </Link>
        </Button>
      </div>

      <PropertyFilters />
      <PropertiesTable data={tableData} />
      <PaginationControls
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
      />
    </div>
  );
}
