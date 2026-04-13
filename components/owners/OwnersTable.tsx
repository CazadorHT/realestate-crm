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
import { User, ChevronRight, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { FaPhone, FaLine, FaFacebook, FaChevronRight } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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

        {/* Mobile/Tablet Card View - Premium Adaptive Grid */}
        <div className="lg:hidden p-4 bg-slate-50/30">
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {owners.map((owner, idx) => {
                const isItemNew = owner.created_at && 
                  differenceInHours(new Date(), new Date(owner.created_at)) < 24;
                const initials = owner.full_name
                  ? owner.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : "??";
                const selected = isSelected(owner.id);

                return (
                  <motion.div
                    key={owner.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      delay: idx * 0.03 
                    }}
                    className={cn(
                      "group relative flex flex-col h-full bg-white rounded-[32px] border transition-all duration-300",
                      selected 
                        ? "border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/20" 
                        : "border-slate-200/60 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50"
                    )}
                  >
                    {/* Card Header: Selection & Avatar & Actions */}
                    <div className="p-5 pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center h-5 w-5 shrink-0 pointer-events-auto z-10">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleSelect(owner.id)}
                              className="rounded-full h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                          </div>
                          
                          <Avatar className="h-10 w-10 border-2 border-slate-50 shadow-sm shrink-0">
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="shrink-0">
                          <OwnerRowActions
                            owner={owner}
                            isAdmin={isAdmin}
                            isMultiTenant={isMultiTenant}
                          />
                        </div>
                      </div>

                      {/* Name and Basic Info */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/protected/owners/${owner.id}`}
                            className="text-base font-semibold text-slate-900 hover:text-blue-700 hover:underline transition-colors line-clamp-1"
                          >
                            {owner.full_name}
                          </Link>
                          {isItemNew && (
                            <Badge className="h-4.5 px-2 text-[10px] bg-amber-500 hover:bg-amber-600 border-0 font-semibold tracking-tighter shrink-0 animate-pulse">
                              NEW
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <div className="bg-blue-50 text-[10px] font-semibold text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-blue-100/50 flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {owner.property_count || 0} ทรัพย์สิน
                          </div>
                          {showBranch && owner.tenants?.name && (
                            <div className="bg-slate-100 text-[10px] font-semibold text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-slate-200/50">
                              สาขา: {owner.tenants.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100/80 mx-5" />

                    {/* Card Body: Contact Action Pills (Hardened Layout) */}
                    <div className="p-5 pt-4 flex-1">
                      <div className="grid grid-cols-1 gap-2">
                        {/* Phone Pill */}
                        <a
                          href={owner.phone ? `tel:${owner.phone}` : "#"}
                          className={cn(
                            "flex items-center justify-between min-h-[46px] w-full px-4 rounded-2xl transition-all font-semibold text-sm",
                            owner.phone 
                              ? "bg-blue-50/50 text-blue-700 hover:bg-blue-600 hover:text-white shadow-xs" 
                              : "bg-slate-50 text-slate-300 pointer-events-none cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <FaPhone className="h-3.5 w-3.5 mb-0.5" />
                            <span>{owner.phone || "ไม่มีเบอร์โทร"}</span>
                          </div>
                          {owner.phone && <FaChevronRight className="h-3 w-3 opacity-50" />}
                        </a>

                        <div className="grid grid-cols-2 gap-2">
                          {/* LINE Pill */}
                          <div
                            className={cn(
                              "flex items-center justify-center gap-2 min-h-[46px] rounded-2xl transition-all font-semibold text-sm px-2",
                              owner.line_id 
                                ? "bg-emerald-50/50 text-emerald-700 border border-emerald-100/50 hover:bg-emerald-600 hover:text-white" 
                                : "bg-slate-50 text-slate-300 border border-slate-100"
                            )}
                          >
                            <FaLine className="h-4 w-4 shrink-0 mb-0.5" />
                            <span className="truncate">{owner.line_id || "LINE"}</span>
                          </div>

                          {/* Facebook Action */}
                          <a
                            href={owner.facebook_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center justify-center gap-2 min-h-[46px] rounded-2xl transition-all font-semibold text-sm px-2",
                              owner.facebook_url 
                                ? "bg-indigo-50/50 text-indigo-700 border border-indigo-100/50 hover:bg-indigo-600 hover:text-white shadow-xs" 
                                : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                            )}
                          >
                            <FaFacebook className="h-4 w-4 shrink-0 mb-0.5" />
                            <span>Facebook</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
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
