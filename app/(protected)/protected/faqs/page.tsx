import { getFaqs } from "@/features/admin/faqs-actions";
import { FAQsTable } from "@/features/admin/components/FAQsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FAQStats } from "@/features/admin/components/FAQStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { CreateFAQDialog } from "@/features/admin/components/CreateFAQDialog";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

interface FAQsPageProps {
  searchParams: Promise<{ page?: string; success?: string }>;
}

export default async function FAQsPage(props: FAQsPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;

  const { faqs, count: totalFaqs } = await getFaqs(page, pageSize);

  const activeFaqs = faqs?.filter((f) => f.is_active).length || 0;

  return (
    <div className=" space-y-6 animate-fade-in">
      {searchParams.success === "true" && <SuccessAnimation />}
      
      <PageHeader
        title="คำถามที่พบบ่อย (FAQs)"
        subtitle="จัดการคำถามและคำตอบสำหรับลูกค้า"
        count={totalFaqs}
        icon="helpCircle"
        actionSlot={<CreateFAQDialog />}
        gradient="blue"
      />

      <FAQStats faqs={faqs ?? []} />

      <FAQsTable
        faqs={faqs ?? []}
        totalCount={totalFaqs}
        currentPage={page}
      />

      {totalFaqs > 0 && (
        <TableFooterStats
          totalCount={totalFaqs}
          unitLabel="คำถาม"
          secondaryStats={
            activeFaqs > 0
              ? [
                  {
                    label: "ใช้งาน (หน้าปัจจุบัน)",
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
