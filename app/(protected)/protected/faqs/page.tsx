import { getFaqs } from "@/features/admin/faqs-actions";
import { FAQsTable } from "@/features/admin/components/FAQsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FAQStats } from "@/features/admin/components/FAQStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

export default async function FAQsPage() {
  const faqs = await getFaqs();

  const totalFaqs = faqs?.length || 0;
  const activeFaqs = faqs?.filter((f) => f.is_active).length || 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
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
        <TableFooterStats
          totalCount={totalFaqs}
          unitLabel="คำถาม"
          secondaryStats={
            activeFaqs > 0
              ? [
                  {
                    label: "ใช้งาน",
                    value: activeFaqs,
                    color: "green" as const,
                  },
                ]
              : []
          }
        />
      )}
    </div>
  );
}
