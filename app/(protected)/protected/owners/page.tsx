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

export const metadata: Metadata = {
  title: "จัดการเจ้าของทรัพย์",
  description: "จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ",
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    all_branches?: string;
  }>;
};

import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export default async function OwnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const q = sp.q || "";
  const allBranches = sp.all_branches === "true";

  const { role, tenantId, supabase } = await requireAuthContext();
  const isAdminUser = role === "ADMIN";
  const { getSystemConfig } = await import("@/lib/actions/system-config");
  const config = await getSystemConfig();
  const isMultiTenant = config?.multi_tenant_enabled ?? false;

  let currentTenantName = null;
  if (tenantId) {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single();
    currentTenantName = tenantData?.name;
  }

  const {
    data: owners,
    count,
  } = await getOwnersQuery({
    q,
    page,
    pageSize: 10,
    allBranches: isAdminUser && allBranches && isMultiTenant,
  });

  const stats = await getOwnersDashboardStatsQuery(
    isAdminUser && allBranches && isMultiTenant,
  );

  const isEmptyState = owners.length === 0 && page === 1 && !q;

  return (
    <div className="space-y-6 animate-fade-in">
      <SuccessAnimation />
      {/* Premium Header */}
      <PageHeader
        title="เจ้าของทรัพย์"
        subtitle="จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ"
        count={count}
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

      <OwnersStats stats={stats} />

      <div id="table" className="space-y-4 scroll-mt-4">
        <SectionTitle
          title="รายการเจ้าของทั้งหมด"
          subtitle="คลิกที่แถวเพื่อดูรายละเอียด"
          color="purple"
        />

        {isEmptyState ? (
          <EmptyState
            icon="userCircle"
            title="ยังไม่มีเจ้าของในระบบ"
            description="เริ่มต้นเพิ่มเจ้าของทรัพย์คนแรกเพื่อจัดการข้อมูลผู้ติดต่อ"
            actionSlot={<CreateOwnerDialog />}
          />
        ) : (
          <>
            <OwnersTable
              owners={owners}
              showBranch={isAdminUser && allBranches}
              isAdmin={isAdminUser}
              isMultiTenant={isMultiTenant}
              currentTenantId={tenantId}
              currentTenantName={currentTenantName}
              count={count}
              q={q}
            />
          </>
        )}
      </div>
    </div>
  );
}
