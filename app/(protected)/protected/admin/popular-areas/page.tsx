import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getPopularAreas } from "@/features/admin/popular-areas-actions";
import { type PopularArea } from "@/features/admin/components/PopularAreasTable";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PopularAreasPageView } from "@/features/admin/components/PopularAreasPageView";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    sort?: string;
    order?: "asc" | "desc";
  }>;
}

export default async function AdminPopularAreasPage({ searchParams }: PageProps) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const sortBy = params.sort || "sort_order";
  const sortOrder = params.order || "asc";

  const { data: areas, totalCount } = await getPopularAreas({
    search,
    page,
    pageSize: 10,
    sortBy,
    sortOrder,
  });

  // Elite Type Safety: Map DB view results to strict PopularArea type
  const mappedAreas: PopularArea[] = (areas || []).map((area) => ({
    ...area,
    id: area.id ?? "", 
    name: area.name ?? "ไม่มีชื่อ", 
    name_en: area.name_en || null,
    name_cn: area.name_cn || null,
    name_ru: area.name_ru || null,
    sort_order: Number(area.sort_order) || 0,
    property_count: Number(area.property_count) || 0,
  }));

  // Get total property count for all popular areas
  const supabase = await createClient();
  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .not("popular_area", "is", null);

  const totalProperties = propertiesCount || 0;

  async function handleRefresh() {
    "use server";
    revalidatePath("/protected/admin/popular-areas");
  }

  return (
    <PopularAreasPageView
      mappedAreas={mappedAreas}
      totalCount={totalCount}
      totalProperties={totalProperties}
      onRefresh={handleRefresh}
    />
  );
}

