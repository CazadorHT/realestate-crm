import { getFaqs } from "@/features/admin/faqs-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  HelpCircle,
  CheckCircle,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { FAQsTable } from "@/features/admin/components/FAQsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default async function FAQsPage() {
  const faqs = await getFaqs();

  // Calculate stats
  const totalFaqs = faqs?.length || 0;
  const activeFaqs = faqs?.filter((f) => f.is_active).length || 0;
  const inactiveFaqs = totalFaqs - activeFaqs;
  const categories = [...new Set(faqs?.map((f) => f.category).filter(Boolean))];
  const totalCategories = categories.length;

  const isEmptyState = totalFaqs === 0;

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header */}
      <PageHeader
        title="คำถามที่พบบ่อย (FAQs)"
        subtitle="จัดการคำถามและคำตอบสำหรับลูกค้า"
        count={totalFaqs}
        icon="helpCircle"
        actionLabel="เพิ่มคำถามใหม่"
        actionHref="/protected/faqs/new"
        actionIcon="plus"
        gradient="blue"
      />

      {/* Statistics Cards */}
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
            <div className="text-2xl font-bold text-green-600">
              {activeFaqs}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปิดใช้งาน</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveFaqs}
            </div>
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

      {/* FAQs Table */}
      <FAQsTable faqs={faqs ?? []} />

      {/* Footer Stats */}
      {totalFaqs > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {totalFaqs} คำถาม</span>
            {activeFaqs > 0 && (
              <span className="text-green-600 font-medium">
                {activeFaqs} ใช้งาน
              </span>
            )}
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
