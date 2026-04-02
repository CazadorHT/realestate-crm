"use client";

import { useMemo, useTransition, useState } from "react";
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
import { 
  bulkDeleteOwnersAction,
  bulkMoveOwnersToTenantAction,
  getAllOwnerIdsAction
} from "@/features/owners/bulk-actions";
import { exportOwnersAction } from "@/features/owners/export-action";
import { toast } from "sonner";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface OwnersTableProps {
  owners: (Owner & {
    property_count?: number;
    tenants?: { name: string } | null;
    tenant_id?: string | null;
  })[];
  showBranch?: boolean;
  isAdmin?: boolean;
  isMultiTenant?: boolean;
  currentTenantId?: string | null;
  currentTenantName?: string | null;
  count?: number;
  q?: string;
}

export function OwnersTable({
  owners,
  showBranch,
  isAdmin,
  isMultiTenant,
  currentTenantId,
  currentTenantName,
  count = 0,
  q = "",
}: OwnersTableProps) {
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

  const [isPending, startTransition] = useTransition();
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const handleSelectAllGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const result = await getAllOwnerIdsAction({
        q,
        allBranches: showBranch,
      });
      if (result.success && result.ids) {
        toggleSelectAll(result.ids);
        toast.info(`เลือกทั้งหมด ${result.ids.length} รายการแล้ว`);
      }
    } catch (err) {
      toast.error("ไม่สามารถเลือกทั้งหมดได้");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkDeleteOwnersAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
        resolve();
      });
    });
  };

  const pullableCount = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const o = owners.find((item) => item.id === id);
      return o?.tenant_id === null || o?.tenant_id === undefined;
    }).length;
  }, [selectedIds, owners]);

  const pullConfirmMessage = useMemo(() => {
    const total = selectedCount;
    const canPull = pullableCount;

    if (total === 0) return null;

    const skippedOwners = Array.from(selectedIds)
      .map((id) => owners.find((o) => o.id === id))
      .filter((o) => o && o.tenant_id !== null);

    const skippedBranches = Array.from(
      new Set(
        skippedOwners.map((o) => {
          const name = o?.tenants?.name || "ไม่ทราบสาขา";
          if (o?.tenant_id === currentTenantId && currentTenantName) {
            return `${currentTenantName} (สาขาคุณ)`;
          }
          return name;
        }),
      ),
    );

    return (
      <span className="space-y-2 block text-left">
        <span>
          คุณกำลังจะดึง <strong className="text-foreground">{canPull}</strong>{" "}
          รายชื่อเจ้าของที่ยังไม่มีสาขา มายังสาขาของคุณ
        </span>
        {total > canPull && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
            <p className="font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ⚠️ ระบบจะข้าม {total - canPull} รายการที่มีสาขาอยู่แล้ว
            </p>
            {skippedBranches.length > 0 && (
              <div className="mt-1 pl-4 border-l border-amber-200">
                {skippedBranches.map((branch, idx) => (
                  <div key={idx} className="opacity-80">
                    • {branch}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </span>
    );
  }, [
    selectedCount,
    pullableCount,
    selectedIds,
    owners,
    currentTenantId,
    currentTenantName,
  ]);

  const handleBulkPull = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkMoveOwnersToTenantAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
        resolve();
      });
    });
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
        onPull={
          isMultiTenant &&
          currentTenantId && 
          currentTenantId !== "ALL" && 
          !showBranch 
            ? handleBulkPull 
            : undefined
        }
        onPullLabel="ดึงมาสาขาตัวเอง"
        onPullConfirmMessage={pullConfirmMessage}
        onExport={() => exportOwnersAction(Array.from(selectedIds))}
        entityName="เจ้าของ"
        className={isPending ? "opacity-50 pointer-events-none" : ""}
      />

      {/* Global Selection Indicator */}
      {isAllSelected && selectedCount < count && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>เลือกทั้งหมด {selectedCount} รายชื่อในหน้านี้แล้ว</span>
          </div>
          <button
            onClick={handleSelectAllGlobal}
            disabled={isGlobalLoading}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            {isGlobalLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            เลือกทั้งหมด {count} รายชื่อในระบบ
          </button>
        </div>
      )}

      {selectedCount === count && count > owners.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>คุณได้เลือกทั้งหมด <strong>{count}</strong> รายชื่อในระบบแล้ว (ทุกหน้า)</span>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all"
          >
            ยกเลิกการเลือก
          </button>
        </div>
      )}

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
                {showBranch && <TableHead>สาขา</TableHead>}
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
                            <div className="bg-amber-500 text-white text-[11px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                              NEW
                            </div>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  {/* สาขา */}
                  {showBranch && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-normal capitalize"
                      >
                        {owner.tenants?.name || "-"}
                      </Badge>
                    </TableCell>
                  )}
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
                    <OwnerRowActions
                      owner={owner}
                      isAdmin={isAdmin}
                      isMultiTenant={isMultiTenant}
                    />
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
                            <Badge className="h-4 px-1.5 text-[11px] bg-amber-500 hover:bg-amber-600 border-0">
                              NEW
                            </Badge>
                          )}
                      </div>
                      <div className="bg-slate-100 text-[11px] font-bold text-slate-500 px-2 py-0.5 rounded-full w-fit mt-1">
                        {owner.property_count || 0} ทรัพย์
                      </div>
                      {showBranch && owner.tenants?.name && (
                        <div className="bg-blue-100 text-[11px] font-bold text-blue-600 px-2 py-0.5 rounded-full w-fit mt-1">
                          สาขา: {owner.tenants.name}
                        </div>
                      )}
                    </div>
                    <OwnerRowActions
                      owner={owner}
                      isAdmin={isAdmin}
                      isMultiTenant={isMultiTenant}
                    />
                  </div>

                  <div className="mt-3 space-y-2">
                    {owner.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
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
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span className="text-slate-400 w-16">LINE ID:</span>
                        <span className="font-medium text-emerald-600">
                          {owner.line_id}
                        </span>
                      </div>
                    )}
                    {owner.facebook_url && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
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

      <PaginationControls
        totalCount={count}
        pageSize={10}
        currentPage={currentPage}
      />
    </div>
  );
}
