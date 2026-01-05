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
    .select("*", { count: "exact" }) // Get count for pagination
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
    "rental_price",
    "bedrooms",
    "status",
    "property_type",
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
  const CLOSED_DEAL_STATUSES = ["SIGNED", "CLOSED_WIN"] as const;
  // 2. Fetch Associations in Parallel
  const soldOrRentedIds = properties
    .filter((p) => p.status === "SOLD" || p.status === "RENTED")
    .map((p) => p.id);

  const [imagesResult, leadsResult, closedLeadsResult] = await Promise.all([
    // Images: cover
    supabase
      .from("property_images")
      .select("property_id, image_url")
      .in("property_id", propertyIds)
      .eq("is_cover", true),

    // Leads: count
    supabase.from("leads").select("property_id").in("property_id", propertyIds),

    // Closed lead (ล่าสุด) สำหรับ SOLD/RENTED เท่านั้น
    soldOrRentedIds.length > 0
      ? supabase
          .from("deals")
          .select(
            `
          property_id,
          deal_type,
          status,
          updated_at,
          lead:leads(full_name)
        `
          )
          .in("property_id", soldOrRentedIds)
          .in("status", CLOSED_DEAL_STATUSES as any)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
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

  // Map closed lead names

  const closedLeadNameMap = new Map<string, string>();

  (closedLeadsResult.data as any[] | undefined)?.forEach((d) => {
    const pid = d?.property_id as string | undefined;
    const name = d?.lead?.full_name as string | undefined;

    if (!pid) return;
    if (!closedLeadNameMap.has(pid) && name) {
      closedLeadNameMap.set(pid, name);
    }
  });

  // Map profile names

  // 4. Transform to Table Data
  const tableData: PropertyTableData[] = properties.map((p) => {
    // Logic for Price Display
    // If listing_type is BOTH, we might prefer showing Price, or handle in Table component.
    // The Table Component handles display logic based on availability.

    // Check "New" status (Created < 7 days)
    const isNew =
      new Date().getTime() - new Date(p.created_at).getTime() <
      7 * 24 * 60 * 60 * 1000;

    const locationHint =
      [p.district, p.province].filter(Boolean).join(", ") ||
      p.address_line1 ||
      "";

    return {
      id: p.id,
      title: p.title,
      description: locationHint || p.description,
      image_url: coverMap.get(p.id) || null,
      property_type: p.property_type,
      listing_type: p.listing_type,
      price: p.price,
      rental_price: p.rental_price,
      status: p.status,
      leads_count: leadsCountMap.get(p.id) || 0,
      updated_at: p.updated_at,
      created_at: p.created_at,
      popular_area: p.popular_area,
      // ✅ ใหม่
      closed_lead_name: closedLeadNameMap.get(p.id) || null,

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
