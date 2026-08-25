import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { UserPlus } from "lucide-react";
import {
  getLeadsQuery,
  getLeadsForKanbanQuery,
  getLeadsDashboardStatsQuery,
} from "@/features/leads/queries";
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
import { LeadsListTour } from "@/features/leads/_components/LeadsListTour";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  return {
    title: isEn ? "Leads" : "จัดการรายชื่อลูกค้า",
    description: isEn
      ? "Manage and track prospective real estate clients"
      : "จัดการและติดตามลูกค้าที่สนใจอสังหาริมทรัพย์",
  };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    stage?: string;
    source?: string;
    lead_type?: string;
    page?: string;
    view?: string;
    allBranches?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const sp = (await searchParams) ?? {};
  
  // [PERFORMANCE] Parallel Fetching: Core Auth & Context
  const [authContext, config] = await Promise.all([
    requireAuthContext(),
    getSystemConfig(),
  ]);

  const { tenantId } = authContext;
  const isMultiTenant = config.multi_tenant_enabled;
  const view = sp.view ?? "list";
  const page = Number(sp.page ?? "1") || 1;

  const toggleViewHref = (v: string) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.stage) params.set("stage", sp.stage);
    if (sp.source) params.set("source", sp.source);
    params.set("view", v);
    return `/protected/leads?${params.toString()}`;
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-0 animate-fade-in">
      <LeadsListTour />
      <SuccessAnimation />
      
      {/* 1. HEADER (Static part fetched in wrapper) */}
      <PageHeaderWrapper sp={sp} view={view} toggleViewHref={toggleViewHref} isEn={isEn} />

      {/* 2. STATS SECTION (Streamed) */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-slate-50 rounded-2xl" />}>
        <LeadsStatsWrapper />
      </Suspense>

      {/* 3. MAIN CONTENT (Streamed) */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
        <LeadsContentWrapper 
          view={view} 
          sp={sp} 
          page={page} 
          tenantId={tenantId}
          isMultiTenant={isMultiTenant}
          isEn={isEn}
        />
      </Suspense>

      <MobileFloatingAction
        href="/protected/leads/new"
        icon={<UserPlus className="h-6 w-6" />}
        label={isEn ? "New Lead" : "สร้างลูกค้าใหม่"}
      />
    </div>
  );
}

/** 🚀 LEADS PERFORMANCE WRAPPERS (Streaming Pattern) */

async function PageHeaderWrapper({
  sp,
  view,
  toggleViewHref,
  isEn,
}: {
  sp: any;
  view: string;
  toggleViewHref: any;
  isEn: boolean;
}) {
  const stats = await getLeadsDashboardStatsQuery();
  const count = stats.totalLeads;

  return (
    <PageHeader
      title={isEn ? "Leads" : "จัดการรายชื่อลูกค้า"}
      subtitle={isEn ? "Manage and track prospective clients" : "จัดการและติดตามลูกค้าที่สนใจ"}
      count={count}
      icon="users"
      actionLabel={isEn ? "New Lead" : "สร้างลูกค้าใหม่"}
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
            📋 {isEn ? "List" : "รายการ"}
          </Link>
          <Link
            href={toggleViewHref("kanban")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              view === "kanban"
                ? "bg-white shadow-sm text-slate-900"
                : "text-white/70 hover:text-white"
            }`}
          >
            📊 {isEn ? "Kanban Board" : "กระดานงาน"}
          </Link>
        </div>
      </div>
    </PageHeader>
  );
}

async function LeadsStatsWrapper() {
  const stats = await getLeadsDashboardStatsQuery();
  return <LeadsStats stats={stats} />;
}

async function LeadsContentWrapper({ 
  view, 
  sp, 
  page, 
  tenantId, 
  isMultiTenant,
  isEn,
}: { 
  view: string; 
  sp: any; 
  page: number; 
  tenantId: string | undefined;
  isMultiTenant: boolean;
  isEn: boolean;
}) {
  if (view === "list") {
    const { data: listLeads, count } = await getLeadsQuery({
      q: sp.q,
      stage: sp.stage,
      source: sp.source,
      leadType: sp.lead_type,
      page,
      pageSize: 20,
    });

    const isEmptyState = listLeads.length === 0 && page === 1 && !sp.q && !sp.stage && !sp.source && !sp.lead_type;

    return (
      <div className="space-y-4">
        <SectionTitle
          title={isEn ? "All Leads" : "รายการลีดทั้งหมด"}
          subtitle={isEn ? "Click a row to view details" : "คลิกที่แถวเพื่อดูรายละเอียด"}
          color="emerald"
        />

        <div id="tour-leads-filters">
          <LeadsFilters />
        </div>

        {isEmptyState ? (
          <EmptyState
            icon="users"
            title={isEn ? "No leads in system yet" : "ยังไม่มีลีดในระบบ"}
            description={
              isEn
                ? "Start by creating your first lead to track interested clients."
                : "เริ่มต้นสร้างลีดแรกของคุณเพื่อติดตามลูกค้าที่สนใจทรัพย์"
            }
            actionLabel={isEn ? "Create First Lead" : "สร้างลีดแรก"}
            actionHref="/protected/leads/new"
            actionIcon="userPlus"
          />
        ) : (
          <div id="tour-leads-table">
            <LeadsTable
              leads={listLeads}
              totalCount={count}
              showBranch={sp.allBranches === "true"}
              currentTenantId={tenantId}
              isMultiTenant={isMultiTenant}
              filters={{ q: sp.q, stage: sp.stage, source: sp.source }}
            />
          </div>
        )}
      </div>
    );
  } else {
    const kanbanLeads = await getLeadsForKanbanQuery();
    return (
      <div className="pt-2">
        <LeadsKanban initialLeads={kanbanLeads} />
      </div>
    );
  }
}

