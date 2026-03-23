import { Suspense } from "react";
import { getServices } from "@/features/services/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreateServiceDialog } from "@/features/admin/components/CreateServiceDialog";
import { ServicesTable } from "@/features/admin/components/ServicesTable";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export const dynamic = "force-dynamic";

interface ServicesPageProps {
  searchParams: Promise<{ page?: string; success?: string }>;
}

async function ServicesContent({ page }: { page: number }) {
  const { data: services, count: totalCount } = await getServices(
    page,
    10,
    true,
  ); // Include inactive

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="บริการที่นำเสนอ"
        subtitle="จัดการบริการของคุณ (ตกแต่งภายใน, ขนย้าย ฯลฯ) และแกลเลอรีรูปภาพ"
        icon="layout"
        count={totalCount}
        actionSlot={<CreateServiceDialog />}
        gradient="blue"
      />

      <ServicesTable
        services={services}
        totalCount={totalCount}
        currentPage={page}
      />
    </div>
  );
}

export default async function ServicesPage(props: ServicesPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;

  return (
    <div className="p-6 space-y-6">
      {searchParams.success === "true" && <SuccessAnimation />}
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500">
            กำลังโหลดข้อมูลบริการ...
          </div>
        }
      >
        <ServicesContent page={page} />
      </Suspense>
    </div>
  );
}
