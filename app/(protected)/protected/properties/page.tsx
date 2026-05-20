import { Metadata } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getPropertiesDashboardStatsQuery, getPropertiesFastCountQuery } from "@/features/properties/queries/stats";
import { getPropertiesTableData } from "@/features/properties/queries/table";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertiesHeader } from "./_components/PropertiesHeader";
import { PropertiesEmptyState } from "./_components/PropertiesEmptyState";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { requireAuthContext } from "@/lib/authz";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { MobileFloatingAction } from "@/components/ui/mobile-floating-action";
import { InventoryListTour } from "@/features/properties/_components/InventoryListTour";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "จัดการทรัพย์",
  description: "จัดการ เพิ่ม แก้ไข และติดตามอสังหาริมทรัพย์ทั้งหมดในระบบ",
};

const PropertiesTable = dynamic(
  () =>
    import("@/components/properties/PropertiesTable").then(
      (mod) => mod.PropertiesTable,
    ),
  {
    loading: () => (
      <div className="h-96 animate-pulse bg-slate-100 rounded-xl" />
    ),
  },
);

const PropertiesDashboard = dynamic(
  () =>
    import("@/components/properties/PropertiesDashboard").then(
      (mod) => mod.PropertiesDashboard,
    ),
  {
    loading: () => (
      <div className="h-32 animate-pulse bg-slate-100 rounded-xl" />
    ),
  },
);

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    listing?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    province?: string;
    district?: string;
    popular_area?: string;
    sortBy?: string;
    sortOrder?: string;
    nearTransit?: string;
    petFriendly?: string;
    fullyFurnished?: string;
    allBranches?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const PAGE_SIZE = 10;
  const currentPage = Number(params.page) || 1;

  // [PERFORMANCE] Parallel Fetching: Break the waterfall for core config
  const [config, authContext] = await Promise.all([
    getSystemConfig(),
    requireAuthContext(),
  ]);

  const { role, tenantId, supabase, user } = authContext;
  const isAdminUser = role === "ADMIN";
  const isAdminOrManager = role === "ADMIN" || role === "MANAGER";
  const isMultiTenant = config.multi_tenant_enabled;
  const currentUserEmail = user.email || "";

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <InventoryListTour />
      <SuccessAnimation />
      <PropertiesHeaderWrapper params={params} />

      {/* DASHBOARD STREAMING */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-slate-100 rounded-2xl" />}>
        <DashboardWrapper allBranches={params.allBranches} />
      </Suspense>

      <div id="table" className="space-y-4 scroll-mt-4">
        {/* Section Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-lg blur-sm opacity-50" />
            <div className="relative w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">รายการทรัพย์สิน</h2>
            <p className="text-xs text-slate-400 font-medium">
              คลิกที่แถวเพื่อดูรายละเอียดหรือแก้ไข
            </p>
          </div>
        </div>

        {/* TABLE & FILTERS STREAMING */}
        <Suspense fallback={<div className="h-96 animate-pulse bg-slate-100 rounded-2xl" />}>
          <TableWrapper
            params={params}
            isAdminUser={isAdminUser}
            isAdminOrManager={isAdminOrManager}
            isMultiTenant={isMultiTenant}
            tenantId={tenantId}
            currentPage={currentPage}
            currentUserEmail={currentUserEmail}
          />
        </Suspense>
      </div>

      <MobileFloatingAction
        href="/protected/properties/new"
        label="เพิ่มทรัพย์ใหม่"
      />
    </div>
  );
}

/** 🚀 PERFORMANCE WRAPPERS (Streaming Pattern) */

async function PropertiesHeaderWrapper({ params }: { params: any }) {
  const count = await getPropertiesFastCountQuery(params.allBranches);
  return <PropertiesHeader count={count} />;
}

async function DashboardWrapper({ allBranches }: { allBranches?: string }) {
  const stats = await getPropertiesDashboardStatsQuery(allBranches);
  return <PropertiesDashboard stats={stats} />;
}

async function TableWrapper({
  params,
  isAdminUser,
  isAdminOrManager,
  isMultiTenant,
  tenantId,
  currentPage,
  currentUserEmail,
}: {
  params: any;
  isAdminUser: boolean;
  isAdminOrManager: boolean;
  isMultiTenant: boolean;
  tenantId: string | undefined;
  currentPage: number;
  currentUserEmail: string;
}) {
  const supabase = await createClient();
  
  // Parallel fetch: Table data AND Tenant Name (if applicable)
  const [tableResult, tenantResult] = await Promise.all([
    getPropertiesTableData(params),
    tenantId
      ? supabase.from("tenants").select("name").eq("id", tenantId).single()
      : Promise.resolve({ data: null }),
  ]);

  const { tableData, count, filterMetadata } = tableResult;
  const currentTenantName = tenantResult.data?.name || null;

  const hasActiveFilters = Object.entries(params).some(([key, value]) => {
    if (key === 'page') return false;
    if (key === 'sortBy' || key === 'sortOrder') return false;
    return value && value !== 'ALL';
  });

  if (tableData.length === 0 && currentPage > 1) {
    redirect("/protected/properties?page=1");
  }

  // Truly Empty: No data AND No active filters
  if (tableData.length === 0 && currentPage === 1 && !hasActiveFilters) {
    return <PropertiesEmptyState />;
  }

  return (
    <>
      <PropertyFilters
        totalCount={count}
        filterMetadata={filterMetadata}
        isMultiTenant={isMultiTenant}
      />
      {tableData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">ไม่พบข้อมูลที่ตรงตามเงื่อนไข</h3>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            ลองปรับเปลี่ยนคำค้นหา หรือใช้ตัวกรองแบบอื่นดูนะครับ
          </p>
        </div>
      ) : (
        <PropertiesTable
          data={tableData}
          isAdmin={isAdminUser}
          isAdminOrManager={isAdminOrManager}
          isMultiTenant={isMultiTenant}
          currentTenantId={tenantId}
          currentTenantName={currentTenantName}
          showBranch={
            isAdminUser && params.allBranches === "true" && isMultiTenant
          }
          totalCount={count}
          filters={params}
          currentUserEmail={currentUserEmail}
        />
      )}
    </>
  );
}
