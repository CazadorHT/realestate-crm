import { Metadata } from "next";
import { OwnersTable } from "@/components/owners/OwnersTable";
import Link from "next/link";
import { OwnersStats } from "@/components/owners/OwnersStats";
import {
  getOwnersQuery,
  getOwnersDashboardStatsQuery,
} from "@/features/owners/queries";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CreateOwnerDialog } from "@/components/owners/CreateOwnerDialog";
import { requireAuthContext } from "@/lib/authz";
import { GlobalLookupToggle } from "@/components/owners/GlobalLookupToggle";
import { Suspense } from "react";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { getSystemConfig } from "@/lib/actions/system-config";

export const metadata: Metadata = {
  title: "จัดการเจ้าของทรัพย์",
  description: "จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ",
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    all_branches?: string;
    owner_type?: string;
  }>;
};

export default async function OwnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const q = sp.q || "";
  const allBranches = sp.all_branches === "true";
  const ownerType = sp.owner_type || "ALL";

  // [PERFORMANCE] Parallel Fetching: Core Auth & Global Context
  const [authContext, config] = await Promise.all([
    requireAuthContext(),
    getSystemConfig(),
  ]);

  const { role, tenantId, supabase } = authContext;
  const isAdminUser = role === "ADMIN";
  const isMultiTenant = config?.multi_tenant_enabled ?? false;

  return (
    <div className="space-y-6 animate-fade-in">
      <SuccessAnimation />
      
      {/* 🚀 1. HEADER (Instant with meta info) */}
      <PageHeader
        title="เจ้าของทรัพย์"
        subtitle="จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ"
        icon="userCircle"
        actionSlot={<CreateOwnerDialog />}
        gradient="purple"
      >
        {isAdminUser && isMultiTenant && (
          <div className="flex justify-end">
            <GlobalLookupToggle />
          </div>
        )}
      </PageHeader>

      {/* 🚀 2. STATS SECTION (Streamed) */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-slate-50 rounded-2xl" />}>
        <OwnersStatsWrapper 
          isAdminUser={isAdminUser} 
          allBranches={allBranches} 
          isMultiTenant={isMultiTenant} 
        />
      </Suspense>

      {/* 🚀 3. MAIN CONTENT (Streamed) */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
        <OwnersContentWrapper 
          q={q} 
          ownerType={ownerType}
          page={page} 
          isAdminUser={isAdminUser} 
          allBranches={allBranches} 
          isMultiTenant={isMultiTenant}
          tenantId={tenantId}
          supabase={supabase}
        />
      </Suspense>
    </div>
  );
}

/** 🚀 OWNERS PERFORMANCE WRAPPERS */

async function OwnersStatsWrapper({ isAdminUser, allBranches, isMultiTenant }: { 
  isAdminUser: boolean; 
  allBranches: boolean; 
  isMultiTenant: boolean; 
}) {
  const stats = await getOwnersDashboardStatsQuery(
    isAdminUser && allBranches && isMultiTenant
  );
  return <OwnersStats stats={stats} />;
}

async function OwnersContentWrapper({ 
  q, 
  ownerType,
  page, 
  isAdminUser, 
  allBranches, 
  isMultiTenant,
  tenantId,
  supabase
}: { 
  q: string; 
  ownerType: string;
  page: number; 
  isAdminUser: boolean; 
  allBranches: boolean; 
  isMultiTenant: boolean;
  tenantId: string | undefined;
  supabase: any;
}) {
  // Parallel fetch: Tenant Name + Main Owners Data
  const [ownersResult, tenantResult] = await Promise.all([
    getOwnersQuery({
      q,
      ownerType,
      page,
      pageSize: 10,
      allBranches: isAdminUser && allBranches && isMultiTenant,
    }),
    tenantId
      ? supabase.from("tenants").select("name").eq("id", tenantId).single()
      : Promise.resolve({ data: null })
  ]);

  const { data: owners, count } = ownersResult;
  const currentTenantName = tenantResult.data?.name || null;

  if (owners.length === 0 && page === 1 && !q && ownerType === "ALL") {
    return (
      <EmptyState
        icon="userCircle"
        title="ยังไม่มีเจ้าของในระบบ"
        description="เริ่มต้นเพิ่มเจ้าของทรัพย์คนแรกเพื่อจัดการข้อมูลผู้ติดต่อ"
        actionSlot={<CreateOwnerDialog />}
      />
    );
  }

  return (
    <div id="table" className="space-y-4 scroll-mt-4">
      <SectionTitle
        title="รายการเจ้าของทั้งหมด"
        subtitle="คลิกที่แถวเพื่อดูรายละเอียด"
        color="purple"
      />
      <OwnersTable
        owners={owners}
        showBranch={isAdminUser && allBranches}
        isAdmin={isAdminUser}
        isMultiTenant={isMultiTenant}
        currentTenantId={tenantId}
        currentTenantName={currentTenantName}
        count={count}
        q={q}
        ownerType={ownerType}
      />
    </div>
  );
}

