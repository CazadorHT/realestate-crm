import { HelpCircle, CheckCircle, XCircle, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FAQStatsProps {
  faqs: any[];
}

export function FAQStats({ faqs }: FAQStatsProps) {
  const totalFaqs = faqs?.length || 0;
  const activeFaqs = faqs?.filter((f) => f.is_active).length || 0;
  const inactiveFaqs = totalFaqs - activeFaqs;
  const categories = [...new Set(faqs?.map((f) => f.category).filter(Boolean))];
  const totalCategories = categories.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">คำถามทั้งหมด</CardTitle>
          <HelpCircle className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFaqs}</div>
          <p className="text-xs text-slate-500 mt-1">Total FAQs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ใช้งานอยู่</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeFaqs}</div>
          <p className="text-xs text-slate-500 mt-1">Active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ปิดใช้งาน</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{inactiveFaqs}</div>
          <p className="text-xs text-slate-500 mt-1">Inactive</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">หมวดหมู่</CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {totalCategories}
          </div>
          <p className="text-xs text-slate-500 mt-1">Categories</p>
        </CardContent>
      </Card>
    </div>
  );
}
