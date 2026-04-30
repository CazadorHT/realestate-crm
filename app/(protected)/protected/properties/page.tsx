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

  const { role, tenantId, supabase } = authContext;
  const isAdminUser = role === "ADMIN";
  const isMultiTenant = config.multi_tenant_enabled;

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
            isMultiTenant={isMultiTenant}
            tenantId={tenantId}
            currentPage={currentPage}
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
  isMultiTenant,
  tenantId,
  currentPage,
}: {
  params: any;
  isAdminUser: boolean;
  isMultiTenant: boolean;
  tenantId: string | undefined;
  currentPage: number;
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

  if (tableData.length === 0 && currentPage > 1) {
    redirect("/protected/properties?page=1");
  }

  if (tableData.length === 0 && currentPage === 1) {
    return <PropertiesEmptyState />;
  }

  return (
    <>
      <PropertyFilters
        totalCount={count}
        filterMetadata={filterMetadata}
        isMultiTenant={isMultiTenant}
      />
      <PropertiesTable
        data={tableData}
        isAdmin={isAdminUser}
        isMultiTenant={isMultiTenant}
        currentTenantId={tenantId}
        currentTenantName={currentTenantName}
        showBranch={
          isAdminUser && params.allBranches === "true" && isMultiTenant
        }
        totalCount={count}
        filters={params}
      />
    </>
  );
}
