import { Suspense } from "react";
import { getServices } from "@/features/services/actions";
import { ServicesPageView } from "@/features/services/components/ServicesPageView";
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
    <ServicesPageView
      services={services}
      totalCount={totalCount}
      activeCount={activeRes.count}
      trashCount={trashRes.count}
      page={page}
      view={view}
    />
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
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Loading...</p>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
          </div>
        }
      >
        <ServicesContent page={page} view={view} />
      </Suspense>
    </div>
  );
}
