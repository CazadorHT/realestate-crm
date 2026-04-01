import { Metadata } from "next";
import Link from "next/link";
import {
  getLeadsQuery,
  getLeadsForKanbanQuery,
  getLeadsDashboardStatsQuery,
} from "@/features/leads/queries";

export const metadata: Metadata = {
  title: "จัดการลูกค้า (Leads)",
  description: "จัดการและติดตามลูกค้าที่สนใจอสังหาริมทรัพย์",
};
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/features/leads/LeadsKanban";
import { LeadsStats } from "@/components/leads/LeadsStats";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { requireAuthContext } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { MobileFloatingAction } from "@/components/ui/mobile-floating-action";
import { UserPlus } from "lucide-react";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    stage?: string;
    page?: string;
    view?: string;
    allBranches?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const { tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const view = sp.view ?? "list";
  const page = Number(sp.page ?? "1") || 1;

  const {
    data: listLeads,
    count,
    pageSize,
  } = await getLeadsQuery({
    q: sp.q,
    stage: sp.stage,
    page,
    pageSize: 20,
  });

  // If kanban, we fetch a larger set (or a different subset)
  // For simplicity, we'll use a separate query for Kanban to avoid pagination issues
  let kanbanLeads: any[] = [];
  if (view === "kanban") {
    const allLeads = await getLeadsForKanbanQuery();
    kanbanLeads = allLeads;
  }

  const toggleViewHref = (v: string) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.stage) params.set("stage", sp.stage);
    params.set("view", v);
    return `/protected/leads?${params.toString()}`;
  };

  /* Fetch Dashboard Stats */
  const stats = await getLeadsDashboardStatsQuery();

  const isEmptyState =
    listLeads.length === 0 && page === 1 && !sp.q && !sp.stage;

  return (
    <div className="space-y-6 animate-fade-in">
      <SuccessAnimation />
      {/* Premium Header */}
      <PageHeader
        title="ลูกค้า (Leads)"
        subtitle="จัดการและติดตามลูกค้าที่สนใจ"
        count={count}
        icon="users"
        actionLabel="สร้างลูกค้าใหม่"
        actionHref="/protected/leads/new"
        actionIcon="userPlus"
        gradient="emerald"
      >
        <div className="flex justify-end">
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 shadow-sm backdrop-blur-sm">
            <Link
              href={toggleViewHref("list")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                view === "list"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-white/70 hover:text-white"
              }`}
            >
              📋 รายการ
            </Link>
            <Link
              href={toggleViewHref("kanban")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                view === "kanban"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-white/70 hover:text-white"
              }`}
            >
              📊 กระดานงาน
            </Link>
          </div>
        </div>
      </PageHeader>

      {/* Stats Section */}
      <LeadsStats stats={stats} />

      {view === "list" ? (
        <div className="space-y-4">
          <SectionTitle
            title="รายการลีดทั้งหมด"
            subtitle="คลิกที่แถวเพื่อดูรายละเอียด"
            color="emerald"
          />

          <LeadsFilters />

          {isEmptyState ? (
            <EmptyState
              icon="users"
              title="ยังไม่มีลีดในระบบ"
              description="เริ่มต้นสร้างลีดแรกของคุณเพื่อติดตามลูกค้าที่สนใจทรัพย์"
              actionLabel="สร้างลีดแรก"
              actionHref="/protected/leads/new"
              actionIcon="userPlus"
            />
          ) : (
            <>
              <LeadsTable 
                leads={listLeads} 
                totalCount={count} 
                showBranch={sp.allBranches === "true"}
                currentTenantId={tenantId}
                isMultiTenant={isMultiTenant}
                filters={{ q: sp.q, stage: sp.stage }} 
              />
            </>
          )}
        </div>
      ) : (
        <div className="pt-2">
          <LeadsKanban initialLeads={kanbanLeads} />
        </div>
      )}

      <MobileFloatingAction 
        href="/protected/leads/new" 
        icon={<UserPlus className="h-6 w-6" />}
        label="สร้างลูกค้าใหม่" 
      />
    </div>
  );
}
