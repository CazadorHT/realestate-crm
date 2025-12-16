import Link from "next/link";
import { getLeadsQuery } from "@/features/leads/queries";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; stage?: string; page?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const page = Number(sp.page ?? "1") || 1;

  const { data, count, pageSize } = await getLeadsQuery({
    q: sp.q,
    stage: sp.stage,
    page,
    pageSize: 10,
  });

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.stage) params.set("stage", sp.stage);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/protected/leads?${qs}` : `/protected/leads`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Link className="rounded-md bg-primary px-3 py-2 text-sm text-white" href="/protected/leads/new">
          + เพิ่ม Lead
        </Link>
      </div>

      <LeadsFilters />
      <LeadsTable leads={data} />

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
           ทั้งหมด {count} รายการ • หน้า {page} จาก {totalPages}
        </div>
        <div className="flex gap-2">
          <Link
            className={`rounded-md border px-3 py-1 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            href={makeHref(page - 1)}
          >
            Prev
          </Link>
          <Link
            className={`rounded-md border px-3 py-1 ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
            href={makeHref(page + 1)}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
