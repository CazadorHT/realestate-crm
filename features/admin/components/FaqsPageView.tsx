"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { FAQStats } from "@/features/admin/components/FAQStats";
import { FAQsTable } from "@/features/admin/components/FAQsTable";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { CreateFAQDialog } from "@/features/admin/components/CreateFAQDialog";
import { FAQItem } from "@/features/admin/faqs-actions";
import { useLanguage } from "@/lib/i18n/language-context";

interface FaqsPageViewProps {
  faqs: FAQItem[];
  currentCount: number;
  activeCount: number;
  trashCount: number;
  page: number;
  currentView: string;
  isSuperAdmin: boolean;
}

export function FaqsPageView({
  faqs,
  currentCount,
  activeCount,
  trashCount,
  page,
  currentView,
  isSuperAdmin,
}: FaqsPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isTrash = currentView === "trash";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          isTrash
            ? isEn
              ? "FAQ Trash & History"
              : "ถังขยะคำถามและประวัติการลบ"
            : isEn
              ? "FAQ Management"
              : "คำถามที่พบบ่อย"
        }
        subtitle={
          isTrash
            ? isEn
              ? "Manage deleted FAQ questions. You can restore or permanently delete them."
              : "จัดการข้อมูลคำถามที่ถูกลบชั่วคราว คุณสามารถกู้คืนหรือลบทิ้งถาวรได้"
            : isEn
              ? "Manage frequently asked questions and answers for public portal visitors"
              : "จัดการคำถามและคำตอบสำหรับลูกค้าและผู้เข้าชมเว็บไซต์"
        }
        count={isTrash ? trashCount : activeCount}
        icon={isTrash ? "history" : "helpCircle"}
        actionSlot={!isTrash && isSuperAdmin && <CreateFAQDialog />}
        gradient={isTrash ? "rose" : "blue"}
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "FAQ Management" : "คำถามที่พบบ่อย" },
        ]}
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
          unitLabel={isEn ? "FAQs" : "คำถาม"}
          secondaryStats={
            activeCount > 0
              ? [
                  {
                    label: isTrash
                      ? isEn
                        ? "In Trash"
                        : "ในถังขยะ"
                      : isEn
                        ? "Active"
                        : "ใช้งานปกติ",
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
