"use client";

import { useMemo } from "react";
import { differenceInHours } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OwnerRowActions } from "@/components/owners/OwnerRowActions";
import { CreateOwnerDialog } from "@/components/owners/CreateOwnerDialog";
import type { Owner } from "@/features/owners/types";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteOwnersAction } from "@/features/owners/bulk-actions";
import { exportOwnersAction } from "@/features/owners/export-action";
import { toast } from "sonner";

interface OwnersTableProps {
  owners: (Owner & { property_count?: number })[];
}

export function OwnersTable({ owners }: OwnersTableProps) {
  const allIds = useMemo(() => owners.map((o) => o.id), [owners]);
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
    const result = await bulkDeleteOwnersAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  if (owners.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">ยังไม่มีเจ้าของทรัพย์</p>
        <div className="mt-4 flex justify-center">
          <CreateOwnerDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onExport={() => exportOwnersAction(Array.from(selectedIds))}
        entityName="เจ้าของ"
      />

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
                <TableHead>ชื่อ</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>LINE</TableHead>
                <TableHead>Facebook</TableHead>
                <TableHead className="text-right">จำนวนทรัพย์</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow
                  key={owner.id}
                  className={isSelected(owner.id) ? "bg-blue-50/50" : ""}
                >
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isSelected(owner.id)}
                      onCheckedChange={() => toggleSelect(owner.id)}
                      aria-label={`เลือก ${owner.full_name}`}
                    />
                  </TableCell>
                  {/* ชื่อ Owner */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-blue-700">
                        <Link
                          className="underline"
                          href={`/protected/owners/${owner.id}`}
                        >
                          {owner.full_name}
                        </Link>
                      </div>
                      {owner.created_at &&
                        differenceInHours(
                          new Date(),
                          new Date(owner.created_at),
                        ) < 24 && (
                          <div className="w-fit">
                            <div className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                              NEW
                            </div>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  {/* เบอร์โทร */}
                  <TableCell>
                    {owner.phone ? (
                      <a
                        href={`tel:${owner.phone}`}
                        className="hover:underline"
                      >
                        {owner.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* LINE */}
                  <TableCell>
                    {owner.line_id || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Facebook */}
                  <TableCell>
                    {owner.facebook_url ? (
                      <a
                        href={owner.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-blue-600"
                      >
                        ดูโปรไฟล์
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* จำนวนทรัพย์ */}
                  <TableCell className="text-right">
                    <span className="font-semibold">
                      {owner.property_count || 0}
                    </span>{" "}
                    <span className="text-muted-foreground text-sm">
                      ทรัพย์
                    </span>
                  </TableCell>
                  {/* จัดการ */}
                  <TableCell className="text-right">
                    <OwnerRowActions id={owner.id} fullName={owner.full_name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {owners.map((owner) => (
            <div
              key={owner.id}
              className={`p-4 transition-colors ${
                isSelected(owner.id) ? "bg-blue-50/50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex gap-4">
                <div className="flex flex-col gap-3 shrink-0 py-1">
                  <Checkbox
                    checked={isSelected(owner.id)}
                    onCheckedChange={() => toggleSelect(owner.id)}
                  />
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/protected/owners/${owner.id}`}
                          className="font-bold text-slate-900 text-sm hover:underline"
                        >
                          {owner.full_name}
                        </Link>
                        {owner.created_at &&
                          differenceInHours(
                            new Date(),
                            new Date(owner.created_at),
                          ) < 24 && (
                            <Badge className="h-4 px-1.5 text-[9px] bg-amber-500 hover:bg-amber-600 border-0">
                              NEW
                            </Badge>
                          )}
                      </div>
                      <div className="bg-slate-100 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full w-fit mt-1">
                        {owner.property_count || 0} ทรัพย์
                      </div>
                    </div>
                    <OwnerRowActions id={owner.id} fullName={owner.full_name} />
                  </div>

                  <div className="mt-3 space-y-2">
                    {owner.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-slate-400 w-16">เบอร์โทร:</span>
                        <a
                          href={`tel:${owner.phone}`}
                          className="hover:underline font-medium"
                        >
                          {owner.phone}
                        </a>
                      </div>
                    )}
                    {owner.line_id && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-slate-400 w-16">LINE ID:</span>
                        <span className="font-medium text-emerald-600">
                          {owner.line_id}
                        </span>
                      </div>
                    )}
                    {owner.facebook_url && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-slate-400 w-16">Facebook:</span>
                        <a
                          href={owner.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600 font-medium"
                        >
                          ดูโปรไฟล์
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
