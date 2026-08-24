import { HelpCircle, CheckCircle, FolderOpen, Eye, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQItem } from "@/features/admin/faqs-actions";
import { useLanguage } from "@/lib/i18n/language-context";

type FAQ = FAQItem;

interface FAQStatsProps {
  faqs: FAQ[];
  activeCount: number;
  trashCount: number;
  isTrash?: boolean;
}

export function FAQStats({ faqs, activeCount, trashCount, isTrash }: FAQStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const totalViews = faqs?.reduce((acc, f) => acc + (Number(f.view_count) || 0), 0) || 0;
  const categories = [...new Set(faqs?.map((f) => f.category).filter(Boolean))];
  const totalCategories = categories.length;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-700">
            {isTrash
              ? isEn
                ? "In Trash"
                : "อยู่ในถังขยะ"
              : isEn
                ? "Total FAQs"
                : "คำถามทั้งหมด"}
          </CardTitle>
          {isTrash ? (
            <History className="h-4 w-4 text-rose-500" />
          ) : (
            <HelpCircle className="h-4 w-4 text-indigo-500" />
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-slate-900">
            {isTrash ? trashCount : activeCount}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isTrash
              ? isEn
                ? "Deleted items"
                : "รายการที่ถูกลบ"
              : isEn
                ? "Active published FAQs"
                : "คำถามที่ใช้งานปกติ"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50/30">
          <CardTitle className="text-sm font-bold text-emerald-700">
            {isEn ? "Total Views" : "ยอดการเข้าชม"}
          </CardTitle>
          <Eye className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-emerald-600">
            {totalViews.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isEn ? "Views on current page" : "ยอดชมรวมหน้าปัจจุบัน"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/30">
          <CardTitle className="text-sm font-bold text-blue-700">
            {isEn ? "Categories" : "หมวดหมู่"}
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalCategories}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isEn ? "Related topic groups" : "กลุ่มคำถามที่เกี่ยวข้อง"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50/30">
          <CardTitle className="text-sm font-bold text-amber-700">
            {isEn ? "System Health" : "สถานะระบบ"}
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-amber-600">
             100%
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isEn ? "Service readiness" : "ความพร้อมในการให้บริการ"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
