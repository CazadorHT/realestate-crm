import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeadRow } from "@/features/leads/types";
import { LeadRowActions } from "@/components/leads/LeadRowActions";
import {
  safeEnumLabel,
  LEAD_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/features/leads/labels";

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ชื่อลูกค้า</TableHead>
            <TableHead>ข้อมูลติดต่อ</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>ที่มา</TableHead>
            <TableHead className="text-center">ดีลที่เกี่ยวข้อง</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <div className="font-medium">
                  <Link className="underline" href={`/protected/leads/${l.id}`}>
                    {l.full_name}
                  </Link>
                </div>
              </TableCell>
              {/* เบอร์โทร */}
              <TableCell className="text-sm text-muted-foreground">
                <div>{l.phone ?? "-"}</div>
                <div>{l.email ?? "-"}</div>
              </TableCell>
              {/* Stage */}
              <TableCell>
                {safeEnumLabel(LEAD_STAGE_LABELS as any, l.stage)}
              </TableCell>
              {/* Source */}
              <TableCell>
                {safeEnumLabel(LEAD_SOURCE_LABELS as any, l.source)}
              </TableCell>
              {/* Action */}
              <TableCell className="text-center">
                {(l as any).deals_count ?? 0}
              </TableCell>
              <TableCell className="text-right">
                <LeadRowActions id={l.id} fullName={l.full_name} />
              </TableCell>
            </TableRow>
          ))}
          {/* ไม่พบ Leads */}
          {leads.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                ไม่พบ Leads
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
