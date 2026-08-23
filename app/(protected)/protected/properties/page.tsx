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

import {
  PropertiesSectionHeader,
  PropertiesNotFoundState,
  AddPropertyMobileButton,
} from "./_components/PropertiesSectionHeader";

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
    assignedToMe?: string;
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
    <div className="space-y-4 md:space-y-6 pb-24 lg:pb-0 animate-fade-in">
      <InventoryListTour />
      <SuccessAnimation />
      <Suspense fallback={<div className="h-20 animate-pulse bg-slate-100/80 rounded-2xl" />}>
        <PropertiesHeaderWrapper params={params} />
      </Suspense>

      {/* DASHBOARD STREAMING */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-slate-100 rounded-2xl" />}>
        <DashboardWrapper allBranches={params.allBranches} />
      </Suspense>

      <div id="table" className="space-y-4 scroll-mt-4">
        {/* Section Title */}
        <PropertiesSectionHeader />

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
            currentUserId={user.id}
          />
        </Suspense>
      </div>

      <AddPropertyMobileButton />
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
  currentUserId,
}: {
  params: any;
  isAdminUser: boolean;
  isAdminOrManager: boolean;
  isMultiTenant: boolean;
  tenantId: string | undefined;
  currentPage: number;
  currentUserEmail: string;
  currentUserId: string;
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
        <PropertiesNotFoundState />
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
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
