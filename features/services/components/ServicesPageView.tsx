"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreateServiceDialog } from "@/features/admin/components/CreateServiceDialog";
import { ServicesTable } from "@/features/admin/components/ServicesTable";
import { type ServiceRow } from "@/features/services/actions";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServicesPageViewProps {
  services: ServiceRow[];
  totalCount: number;
  activeCount: number;
  trashCount: number;
  page: number;
  view: string;
}

export function ServicesPageView({
  services,
  totalCount,
  activeCount,
  trashCount,
  page,
  view,
}: ServicesPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isTrash = view === "trash";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={
          isTrash
            ? isEn
              ? "Trash & Deleted Services"
              : "ถังขยะและข้อมูลที่ถูกลบ"
            : isEn
              ? "Services & Solutions"
              : "บริการที่นำเสนอ"
        }
        subtitle={
          isTrash
            ? isEn
              ? "Inactive services. You can restore or permanently delete them from here."
              : "สินทรัพย์บริการที่หยุดแสดงผลชั่วคราว คุณสามารถกู้คืนหรือลบถาวรได้จากที่นี่"
            : isEn
              ? "Manage customer services (Interior, Moving, Cleaning, etc.) and image galleries"
              : "จัดการบริการของคุณ (ตกแต่งภายใน, ขนย้าย, ทำความสะอาด ฯลฯ) และแกลเลอรีรูปภาพ"
        }
        icon={isTrash ? "history" : "layout"}
        count={totalCount}
        actionSlot={!isTrash && <CreateServiceDialog />}
        gradient={isTrash ? "rose" : "blue"}
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "Services & Solutions" : "บริการที่นำเสนอ" },
        ]}
      />

      <ServicesTable
        services={services}
        totalCount={totalCount}
        activeCount={activeCount}
        trashCount={trashCount}
        currentPage={page}
      />
    </div>
  );
}
