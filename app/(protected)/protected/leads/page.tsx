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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    stage?: string;
    page?: string;
    view?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
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

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  // If kanban, we fetch a larger set (or a different subset)
  // For simplicity, we'll use a separate query for Kanban to avoid pagination issues
  let kanbanLeads: any[] = [];
  if (view === "kanban") {
    const allLeads = await getLeadsForKanbanQuery();
    kanbanLeads = allLeads;
  }

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.stage) params.set("stage", sp.stage);
    if (sp.view) params.set("view", sp.view);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/protected/leads?${qs}` : `/protected/leads`;
  };

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
          <div className="flex bg-white/10 dark:bg-slate-800/10 p-1 rounded-xl border border-white/20 shadow-sm backdrop-blur-sm">
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
              <LeadsTable leads={listLeads} />

              <div className="flex items-center justify-between text-sm bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="text-slate-600 font-medium">
                  ทั้งหมด <span className="text-slate-900">{count}</span> รายการ
                  • หน้า <span className="text-slate-900">{page}</span> จาก{" "}
                  <span className="text-slate-900">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    className={`rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium hover:bg-slate-50 transition-colors ${
                      page <= 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                    href={makeHref(page - 1)}
                  >
                    ← ก่อนหน้า
                  </Link>
                  <Link
                    className={`rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium hover:bg-slate-50 transition-colors ${
                      page >= totalPages ? "pointer-events-none opacity-50" : ""
                    }`}
                    href={makeHref(page + 1)}
                  >
                    ถัดไป →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="pt-2">
          <LeadsKanban initialLeads={kanbanLeads} />
        </div>
      )}
    </div>
  );
}
