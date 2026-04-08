import { HelpCircle, CheckCircle, XCircle, FolderOpen, Eye, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "@/lib/database.types";

type FAQ = Database["public"]["Tables"]["faqs"]["Row"];

interface FAQStatsProps {
  faqs: FAQ[];
  activeCount: number;
  trashCount: number;
  isTrash?: boolean;
}

export function FAQStats({ faqs, activeCount, trashCount, isTrash }: FAQStatsProps) {
  const totalViews = faqs?.reduce((acc, f) => acc + (Number(f.view_count) || 0), 0) || 0;
  const categories = [...new Set(faqs?.map((f) => f.category).filter(Boolean))];
  const totalCategories = categories.length;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-700">
            {isTrash ? "อยู่ในถังขยะ" : "คำถามทั้งหมด"}
          </CardTitle>
          {isTrash ? (
            <History className="h-4 w-4 text-rose-500" />
          ) : (
            <HelpCircle className="h-4 w-4 text-indigo-500" />
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-black text-slate-900">
            {isTrash ? trashCount : activeCount}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isTrash ? "รายการที่ถูกลบ" : "คำถามที่ใช้งานปกติ"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50/30">
          <CardTitle className="text-sm font-bold text-emerald-700">ยอดการเข้าชม</CardTitle>
          <Eye className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-black text-emerald-600">
            {totalViews.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            ยอดชมรวมหน้าปัจจุบัน
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/30">
          <CardTitle className="text-sm font-bold text-blue-700">หมวดหมู่</CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-black text-blue-600">
            {totalCategories}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            กลุ่มคำถามที่เกี่ยวข้อง
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50/30">
          <CardTitle className="text-sm font-bold text-amber-700">สถานะระบบ</CardTitle>
          <CheckCircle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-black text-amber-600">
             100%
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            ความพร้อมในการให้บริการ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
