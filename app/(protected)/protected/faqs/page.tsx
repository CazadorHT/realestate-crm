import { getFaqs } from "@/features/admin/faqs-actions";
import { FAQsTable } from "@/features/admin/components/FAQsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FAQStats } from "@/features/admin/components/FAQStats";

export default async function FAQsPage() {
  const faqs = await getFaqs();

  const totalFaqs = faqs?.length || 0;
  const activeFaqs = faqs?.filter((f) => f.is_active).length || 0;

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
      <FAQStats faqs={faqs ?? []} />

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
