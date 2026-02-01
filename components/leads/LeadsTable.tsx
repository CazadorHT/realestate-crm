"use client";

import { useMemo } from "react";
import { differenceInHours } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { LeadRow } from "@/features/leads/types";
import { LeadRowActions } from "@/components/leads/LeadRowActions";
import {
  safeEnumLabel,
  LEAD_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/features/leads/labels";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteLeadsAction } from "@/features/leads/bulk-actions";
import { exportLeadsAction } from "@/features/leads/export-action";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const allIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteLeadsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onExport={() => exportLeadsAction(Array.from(selectedIds))}
        entityName="ลีด"
      />

      <div className="rounded-xl border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label="เลือกทั้งหมด"
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <TableHead>ชื่อลูกค้า</TableHead>
              <TableHead>ข้อมูลติดต่อ</TableHead>
              <TableHead>ทรัพย์ที่สนใจ</TableHead>
              <TableHead>ข้อความ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>ที่มา</TableHead>
              <TableHead className="text-center">ดีลที่เกี่ยวข้อง</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow
                key={l.id}
                className={isSelected(l.id) ? "bg-blue-50/50" : ""}
              >
                <TableCell className="w-[50px]">
                  <Checkbox
                    checked={isSelected(l.id)}
                    onCheckedChange={() => toggleSelect(l.id)}
                    aria-label={`เลือก ${l.full_name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-blue-700">
                      <Link
                        className="underline"
                        href={`/protected/leads/${l.id}`}
                      >
                        {l.full_name}
                      </Link>
                    </div>
                    {l.created_at &&
                      differenceInHours(new Date(), new Date(l.created_at)) <
                        24 && (
                        <div className="w-fit">
                          <div className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                            NEW
                          </div>
                        </div>
                      )}
                  </div>
                </TableCell>
                {/* เบอร์โทร */}
                <TableCell className="text-sm text-muted-foreground">
                  <div>{l.phone ?? "-"}</div>
                  {l.email && <div>{l.email}</div>}
                  {(l as any).line_id && (
                    <div className="text-green-600">
                      Line: {(l as any).line_id}
                    </div>
                  )}
                </TableCell>
                {/* Property */}
                <TableCell>
                  {(l as any).property ? (
                    <Link
                      href={`/properties/${(l as any).property.id}`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline block max-w-[200px] truncate"
                    >
                      {(l as any).property.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {/* Message/Note */}
                <TableCell>
                  <div
                    className="max-w-[200px] truncate text-sm text-muted-foreground"
                    title={l.note || ""}
                  >
                    {l.note || "-"}
                  </div>
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
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  ไม่พบ Leads
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
