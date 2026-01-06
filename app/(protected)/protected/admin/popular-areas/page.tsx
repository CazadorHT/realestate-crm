import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getPopularAreasAction } from "@/features/admin/popular-areas-actions";
import { PopularAreasTable } from "@/features/admin/components/PopularAreasTable";
import { MapPin } from "lucide-react";

export default async function AdminPopularAreasPage() {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const areas = await getPopularAreasAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
          <MapPin className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            จัดการทำเล (Area Management)
          </h1>
          <p className="text-slate-500">
            เพิ่ม/ลบ/แก้ไข รายชื่อทำเลยอดนิยมที่ใช้ในระบบ
          </p>
        </div>
      </div>

      <PopularAreasTable initialData={areas || []} />
    </div>
  );
}
