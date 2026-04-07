import { Suspense } from "react";
import { getServices } from "@/features/services/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreateServiceDialog } from "@/features/admin/components/CreateServiceDialog";
import { ServicesTable } from "@/features/admin/components/ServicesTable";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export const dynamic = "force-dynamic";

interface ServicesPageProps {
  searchParams: Promise<{ 
    page?: string; 
    success?: string;
    view?: string;
  }>;
}

async function ServicesContent({ 
  page, 
  view = "active" 
}: { 
  page: number; 
  view?: string;
}) {
  const isTrash = view === "trash";

  // Parallel Fetch for Elite Efficiency (Counts only)
  const [activeRes, trashRes] = await Promise.all([
    getServices(1, 1, true, false), // Fetch active count
    getServices(1, 1, true, true),  // Fetch trash count
  ]);

  // Main Data Fetch
  const { data: services, count: totalCount } = await getServices(
    page,
    10,
    true,      // includeInactive
    isTrash    // onlyDeleted
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={isTrash ? "ถังขยะและข้อมูลที่ถูกลบ" : "บริการที่นำเสนอ"}
        subtitle={isTrash 
          ? "สินทรัพย์ที่หยุดแสดงผลชั่วคราว คุณสามารถกู้คืนหรือลบถาวรได้จากที่นี่" 
          : "จัดการบริการของคุณ (ตกแต่งภายใน, ขนย้าย ฯลฯ) และแกลเลอรีรูปภาพ"
        }
        icon={isTrash ? "history" : "layout"}
        count={totalCount}
        actionSlot={!isTrash && <CreateServiceDialog />}
        gradient={isTrash ? "rose" : "blue"}
      />

      <ServicesTable
        services={services}
        totalCount={totalCount}
        activeCount={activeRes.count}
        trashCount={trashRes.count}
        currentPage={page}
      />
    </div>
  );
}

export default async function ServicesPage(props: ServicesPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const view = searchParams.view || "active";

  return (
    <div className="p-6 space-y-6">
      {searchParams.success === "true" && <SuccessAnimation />}
      <Suspense
        fallback={
          <div className="p-20 text-center text-slate-400 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200 animate-pulse">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">กำลังเริ่มต้นระบบจัดการสินทรัพย์...</p>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
          </div>
        }
      >
        <ServicesContent page={page} view={view} />
      </Suspense>
    </div>
  );
}
