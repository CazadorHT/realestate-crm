import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getPopularAreas } from "@/features/admin/popular-areas-actions";
import { PopularAreasTable } from "@/features/admin/components/PopularAreasTable";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreatePopularAreaDialog } from "@/features/admin/components/CreatePopularAreaDialog";
import { PopularAreasStats } from "@/features/admin/components/PopularAreasStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function AdminPopularAreasPage({ searchParams }: PageProps) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;

  const { data: areas, totalCount, success } = await getPopularAreas({
    search,
    page,
    pageSize: 10,
  });

  // Get total property count for all popular areas
  const supabase = await createClient();
  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("popular_area", "is", null);

  const totalProperties = propertiesCount || 0;

  async function handleRefresh() {
    "use server";
    revalidatePath("/protected/admin/popular-areas");
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                จัดการทำเลยอดนิยม
              </h1>
            </div>
            <p className="text-white/80 text-sm md:text-base max-w-md text-left">
              เพิ่ม ลบ แก้ไข รายชื่อทำเลยอดนิยมที่ใช้ในระบบ • มีทั้งหมด{" "}
              <span className="font-bold text-white">{totalCount}</span> ทำเล
            </p>
          </div>

          <CreatePopularAreaDialog onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Statistics Cards */}
      <PopularAreasStats
        totalAreas={totalCount}
        totalProperties={totalProperties}
      />

      {/* Popular Areas Table */}
      <div className="rounded-xl lg:border lg:border-slate-200 lg:bg-white shadow-sm overflow-hidden">
        <PopularAreasTable initialData={areas || []} totalCount={totalCount} />
      </div>

      {/* Footer Stats */}
      {totalCount > 0 && (
        <TableFooterStats
          totalCount={totalCount}
          unitLabel="ทำเล"
          secondaryStats={[
            {
              label: "ทรัพย์",
              value: totalProperties,
              color: "blue",
            },
          ]}
        />
      )}
    </div>
  );
}
