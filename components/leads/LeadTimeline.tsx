import type { Database } from "@/lib/database.types";
//เป็น Server component ก็ได้ เพราะรับ activities มาแล้ว แต่ทำ client ก็ได้เช่นกัน

type ActivityRow = Database["public"]["Tables"]["lead_activities"]["Row"];

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

export function LeadTimeline({ activities }: { activities: ActivityRow[] }) {
  if (!activities.length) {
    return <div className="text-sm text-muted-foreground">ยังไม่มีประวัติกิจกรรม</div>;
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{a.activity_type}</div>
            <div className="text-xs text-muted-foreground">{formatDate(a.created_at)}</div>
          </div>
          {a.property_id && (
            <div className="mt-1 text-xs text-muted-foreground">Property: {a.property_id}</div>
          )}
          <div className="mt-2 text-sm whitespace-pre-wrap">{a.note}</div>
        </div>
      ))}
    </div>
  );
}
