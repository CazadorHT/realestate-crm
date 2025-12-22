import Link from "next/link";
import {
  getLeadsQuery,
  getLeadsForKanbanQuery,
} from "@/features/leads/queries";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/features/leads/LeadsKanban";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border">
            <Link
              href={toggleViewHref("list")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "list"
                  ? "bg-white dark:bg-slate-950 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </Link>
            <Link
              href={toggleViewHref("kanban")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "kanban"
                  ? "bg-white dark:bg-slate-950 shadow-sm active:scale-95"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Kanban
            </Link>
          </div>
          <Link
            className="rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
            href="/protected/leads/new"
          >
            + เพิ่ม Lead
          </Link>
        </div>
      </div>

      {view === "list" ? (
        <>
          <LeadsFilters />
          <LeadsTable leads={listLeads} />

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              ทั้งหมด {count} รายการ • หน้า {page} จาก {totalPages}
            </div>
            <div className="flex gap-2">
              <Link
                className={`rounded-md border px-3 py-1 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
                href={makeHref(page - 1)}
              >
                Prev
              </Link>
              <Link
                className={`rounded-md border px-3 py-1 ${
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
                href={makeHref(page + 1)}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="pt-2">
          <LeadsKanban initialLeads={kanbanLeads} />
        </div>
      )}
    </div>
  );
}
