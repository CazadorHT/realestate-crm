import { createClient } from "@/lib/supabase/server";
import {
  PropertiesTable,
  PropertyTableData,
} from "@/components/properties/PropertiesTable";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { getPropertiesDashboardStatsQuery } from "@/features/properties/queries";
import { PropertiesDashboard } from "@/components/properties/PropertiesDashboard";
import type { Database } from "@/lib/database.types";

type PropertyStatus = Database["public"]["Enums"]["property_status"];
type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

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
      `title.ilike.%${q}%,description.ilike.%${q}%,address_line1.ilike.%${q}%`,
    );
  }

  // Filters
  if (status) {
    query = query.eq("status", status as PropertyStatus);
  }
  if (type) {
    query = query.eq("property_type", type as PropertyType);
  }
  if (listing) {
    query = query.eq("listing_type", listing as ListingType);
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

  if (error) {
    console.error("Error fetching properties:", error);
    return (
      <div className="p-8 text-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    );
  }

  // Redirect if page is empty and not on first page
  if (properties.length === 0 && currentPage > 1) {
    redirect("/protected/properties?page=1");
  }

  const propertyIds = properties.map((p) => p.id);
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
        `,
          )
          .in("property_id", soldOrRentedIds)
          .in("status", [...CLOSED_DEAL_STATUSES])
          .order("updated_at", { ascending: false })
      : Promise.resolve({
          data: [] as Array<{
            property_id: string;
            lead: { full_name: string | null } | null;
          }>,
        }),
  ]);
  // 3. Map Data
  const coverMap = new Map(
    imagesResult.data?.map((img) => [img.property_id, img.image_url]),
  );

  // Count leads per property
  const leadsCountMap = new Map<string, number>();

  leadsResult.data?.forEach((lead) => {
    if (lead.property_id) {
      leadsCountMap.set(
        lead.property_id,
        (leadsCountMap.get(lead.property_id) || 0) + 1,
      );
    }
  });

  // Map closed lead names

  const closedLeadNameMap = new Map<string, string>();

  closedLeadsResult.data?.forEach((d) => {
    const pid = d?.property_id;
    const name = d?.lead?.full_name;

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
      closed_lead_name: closedLeadNameMap.get(p.id) || null,
      original_price: p.original_price,
      original_rental_price: p.original_rental_price,
      is_new: isNew,
      view_count: p.view_count || 0,
    };
  });

  const stats = await getPropertiesDashboardStatsQuery();

  // Check if truly empty (no properties at all, not just filtered)
  const isEmptyState = properties.length === 0 && currentPage === 1;

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 shadow-xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <PlusCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                ทรัพย์ทั้งหมด
              </h1>
            </div>
            <p className="text-blue-100 text-sm md:text-base max-w-md">
              จัดการและติดตามทรัพย์สินของคุณ • มีทั้งหมด{" "}
              <span className="font-bold text-white">{count || 0}</span> รายการ
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
          >
            <Link href="/protected/properties/new">
              <PlusCircle className="h-5 w-5 mr-2" />
              เพิ่มทรัพย์ใหม่
            </Link>
          </Button>
        </div>
      </div>

      <PropertiesDashboard stats={stats} />

      <div className="space-y-4">
        {/* Enhanced Section Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur-sm opacity-50" />
            <div className="relative w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              รายการทรัพย์สิน
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              คลิกที่แถวเพื่อดูรายละเอียดหรือแก้ไข
            </p>
          </div>
        </div>

        <PropertyFilters />

        {/* Empty State UI */}
        {isEmptyState ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12">
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-20 h-20 border-4 border-slate-400 rounded-xl rotate-12" />
              <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-slate-400 rounded-full" />
              <div className="absolute top-1/2 left-1/3 w-12 h-12 border-4 border-slate-400 rounded-lg -rotate-6" />
            </div>

            <div className="relative flex flex-col items-center justify-center text-center space-y-6">
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150" />
                <div className="relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/30">
                  <PlusCircle className="h-12 w-12 text-white" />
                </div>
              </div>

              {/* Text */}
              <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-bold text-slate-800">
                  ยังไม่มีทรัพย์ในระบบ
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  เริ่มต้นสร้างรายการทรัพย์สินแรกของคุณเลย! ระบบจะช่วยจัดการ
                  ติดตาม และนำเสนอทรัพย์ของคุณอย่างมืออาชีพ
                </p>
              </div>

              {/* CTA Button */}
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
              >
                <Link href="/protected/properties/new">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  เพิ่มทรัพย์แรกของคุณ
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <PropertiesTable data={tableData} />
            <PaginationControls
              totalCount={count ?? 0}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
