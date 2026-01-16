import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getPopularAreasAction } from "@/features/admin/popular-areas-actions";
import { PopularAreasTable } from "@/features/admin/components/PopularAreasTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Map, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPopularAreasPage() {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const areas = await getPopularAreasAction();

  // Get property count for areas
  const supabase = await createClient();
  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("popular_area", "is", null);

  // Calculate stats
  const totalAreas = areas?.length || 0;
  const totalProperties = propertiesCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            จัดการทำเลยอดนิยม
          </h1>
          <p className="text-slate-500 mt-2">
            เพิ่ม ลบ แก้ไข รายชื่อทำเลยอดนิยมที่ใช้ในระบบ
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ทำเลทั้งหมด</CardTitle>
            <MapPin className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAreas}</div>
            <p className="text-xs text-slate-500 mt-1">Popular areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ทรัพย์ในทำเล</CardTitle>
            <Map className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalProperties}
            </div>
            <p className="text-xs text-slate-500 mt-1">Properties with area</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เฉลี่ยต่อทำเล</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalAreas > 0 ? Math.round(totalProperties / totalAreas) : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Avg properties/area</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Areas Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <PopularAreasTable initialData={areas || []} />
      </div>

      {/* Footer Stats */}
      {totalAreas > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {totalAreas} ทำเล</span>
            <span className="text-blue-600 font-medium">
              {totalProperties} ทรัพย์
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
