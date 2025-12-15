import Link from "next/link";
import { getAllLeads } from "@/lib/db/leads";

export default async function LeadsPage() {
  const leads = await getAllLeads();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Link
          href="/protected/leads/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1 text-sm text-white"
        >
          + เพิ่ม Lead
        </Link>
      </div>

      <div className="rounded-xl border">
        <div className="grid grid-cols-6 gap-2 border-b p-3 text-xs text-muted-foreground">
          <div>ชื่อ</div>
          <div>เบอร์</div>
          <div>Stage</div>
          <div>Source</div>
          <div>งบ</div>
          <div>ดู</div>
        </div>

        {leads.map((l) => (
          <div key={l.id} className="grid grid-cols-6 gap-2 p-3 text-sm border-b last:border-b-0">
            <div className="font-medium">{l.full_name}</div>
            <div>{l.phone ?? "-"}</div>
            <div>{l.stage}</div>
            <div>{l.source ?? "-"}</div>
            <div>
              {l.budget_min ?? "-"} - {l.budget_max ?? "-"}
            </div>
            <div>
              <Link className="underline" href={`/protected/leads/${l.id}`}>
                เปิด
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!leads.length && (
        <div className="text-sm text-muted-foreground">ยังไม่มี lead ในระบบ</div>
      )}
    </div>
  );
}
