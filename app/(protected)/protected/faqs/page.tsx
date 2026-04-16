import { getFaqs } from "@/features/admin/faqs-actions";
import { FAQsTable } from "@/features/admin/components/FAQsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FAQStats } from "@/features/admin/components/FAQStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { CreateFAQDialog } from "@/features/admin/components/CreateFAQDialog";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { requireAuthContext } from "@/lib/authz";

interface FAQsPageProps {
  searchParams: Promise<{ page?: string; success?: string; view?: string; q?: string }>;
}

export default async function FAQsPage(props: FAQsPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const currentView = searchParams.view || "active";
  const search = searchParams.q || "";
  const isTrash = currentView === "trash";
  const pageSize = 10;

  const { role } = await requireAuthContext();
  const isSuperAdmin = role === "ADMIN";

  // Parallel fetching for counts and data
  const [activeData, trashData] = await Promise.all([
    getFaqs(1, 1, false, search),
    getFaqs(1, 1, true, search),
  ]);

  const activeCount = activeData.count;
  const trashCount = trashData.count;

  // Fetch current page data
  const { faqs, count: currentCount } = await getFaqs(page, pageSize, isTrash, search);

  return (
    <div className=" space-y-6 animate-fade-in">
      {searchParams.success === "true" && <SuccessAnimation />}
      
      <PageHeader
        title={isTrash ? "ถังขยะและประวัติการลบ (FAQs)" : "คำถามที่พบบ่อย (FAQs)"}
        subtitle={isTrash ? "จัดการข้อมูลคำถามที่ถูกลบชั่วคราว คุณสามารถกู้คืนหรือลบทิ้งถาวรได้" : "จัดการคำถามและคำตอบสำหรับลูกค้า"}
        count={isTrash ? trashCount : activeCount}
        icon={isTrash ? "history" : "helpCircle"}
        actionSlot={!isTrash && isSuperAdmin && <CreateFAQDialog />}
        gradient={isTrash ? "rose" : "blue"}
      />

      <FAQStats 
        faqs={faqs ?? []} 
        activeCount={activeCount}
        trashCount={trashCount}
        isTrash={isTrash}
      />

      <FAQsTable
        faqs={faqs ?? []}
        totalCount={currentCount}
        currentPage={page}
        activeTab={currentView}
        activeCount={activeCount}
        trashCount={trashCount}
        isSuperAdmin={isSuperAdmin}
      />

      {currentCount > 0 && (
        <TableFooterStats
          totalCount={currentCount}
          unitLabel="คำถาม"
          secondaryStats={
            activeCount > 0
              ? [
                  {
                    label: isTrash ? "ในถังขยะ" : "ใช้งานปกติ",
                    value: isTrash ? trashCount : activeCount,
                    color: isTrash ? "red" : ("green" as const),
                  },
                ]
              : []
          }
        />
      )}
    </div>
  );
}
