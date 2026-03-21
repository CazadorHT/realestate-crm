import { Suspense } from "react";
import { getServices } from "@/features/services/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreateServiceDialog } from "@/features/admin/components/CreateServiceDialog";
import { ServicesTable } from "@/features/admin/components/ServicesTable";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export const dynamic = "force-dynamic";

async function ServicesContent() {
  const services = await getServices(true); // Include inactive

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SuccessAnimation />
      <PageHeader
        title="บริการที่นำเสนอ"
        subtitle="จัดการบริการของคุณ (ตกแต่งภายใน, ขนย้าย ฯลฯ) และแกลเลอรีรูปภาพ"
        icon="layout"
        count={services.length}
        actionSlot={<CreateServiceDialog />}
        gradient="blue"
      />

      <ServicesTable services={services} />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          กำลังโหลดข้อมูลบริการ...
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
