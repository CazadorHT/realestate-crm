"use client";

import { useMemo, useState, useTransition } from "react";
import { differenceInHours } from "date-fns";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import {
  bulkDeleteLeadsAction,
  getAllLeadIdsAction,
} from "@/features/leads/bulk-actions";
import { exportLeadsAction } from "@/features/leads/export-action";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Building2,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  FaPhone,
  FaLine,
  FaEnvelope,
  FaChevronRight,
  FaCalendar,
  FaBuilding,
  FaNoteSticky,
} from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { TransferLeadsDialog } from "@/features/leads/components/TransferLeadsDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

export function LeadsTable({
  leads,
  totalCount,
  showBranch,
  currentTenantId,
  isMultiTenant,
  filters = {},
}: {
  leads: LeadRow[];
  totalCount: number;
  showBranch?: boolean;
  currentTenantId?: string | null;
  isMultiTenant?: boolean;
  filters?: { q?: string; stage?: string };
}) {
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

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();

  const handleSelectAllGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const result = await getAllLeadIdsAction(filters);
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleBulkDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkDeleteLeadsAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
          handleSuccessFeedback();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
        resolve();
      });
    });
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onExport={() => exportLeadsAction(Array.from(selectedIds))}
        onTransfer={
          isMultiTenant &&
          currentTenantId &&
          currentTenantId !== "ALL" &&
          !showBranch
            ? () => setIsTransferDialogOpen(true)
            : undefined
        }
        entityName="ลีด"
        className={isTransitionPending ? "opacity-50 pointer-events-none" : ""}
      />

      {/* Global Selection Indicator */}
      {isAllSelected && selectedCount < totalCount && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>เลือกทั้งหมด {selectedCount} ลีดในหน้านี้แล้ว</span>
          </div>
          <button
            onClick={handleSelectAllGlobal}
            disabled={isGlobalLoading}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            {isGlobalLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            เลือกทั้งหมด {totalCount} ลีดในระบบ
          </button>
        </div>
      )}

      {selectedCount === totalCount && totalCount > leads.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              คุณได้เลือกทั้งหมด <strong>{totalCount}</strong> ลีดในระบบแล้ว
              (ทุกหน้า)
            </span>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all"
          >
            ยกเลิกการเลือก
          </button>
        </div>
      )}

      <TransferLeadsDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        selectedIds={Array.from(selectedIds)}
        onSuccess={() => {
          clearSelection();
        }}
      />

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
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
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>ข้อมูลติดต่อ</TableHead>
                <TableHead>ทรัพย์ที่สนใจ</TableHead>
                <TableHead>ข้อความ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>ที่มา / UTM</TableHead>
                {isMultiTenant && <TableHead>สาขา</TableHead>}
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
                            <div className="bg-amber-500 text-white text-[11px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                              NEW
                            </div>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  {/* เบอร์โทร */}
                  <TableCell className="text-[11px] text-muted-foreground">
                    <div className="font-medium text-slate-700">
                      {l.phone ?? "-"}
                    </div>
                    {l.email && <div>{l.email}</div>}
                    {(l as any).line_id && (
                      <div className="text-green-600 font-medium">
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
                      className="max-w-[200px] truncate text-[11px] text-muted-foreground"
                      title={l.note || ""}
                    >
                      {l.note || "-"}
                    </div>
                  </TableCell>
                  {/* Stage */}
                  <TableCell className="text-[11px] font-medium">
                    {safeEnumLabel(LEAD_STAGE_LABELS as any, l.stage)}
                  </TableCell>
                  {/* AI Score */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="secondary"
                        className={`w-fit font-bold ${(l as any).ai_score >= 50 ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}
                      >
                        {(l as any).ai_score ?? 0}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {(l as any).ai_status_label || "New Visitor"}
                      </span>
                    </div>
                  </TableCell>
                  {/* Source / UTM */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-[11px]">
                        {safeEnumLabel(LEAD_SOURCE_LABELS as any, l.source)}
                      </span>
                      {(l as any).utm_source && (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="text-[11px] h-5 px-1.5 border-emerald-100 bg-emerald-50 text-emerald-700"
                          >
                            {(l as any).utm_source}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {/* Branch */}
                  {isMultiTenant && (
                    <TableCell className="text-[11px] font-medium text-slate-500">
                      {(l as any).tenants?.name || "-"}
                    </TableCell>
                  )}
                  {/* Action */}
                  <TableCell className="text-center">
                    {(l as any).deals_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <LeadRowActions
                      id={l.id}
                      fullName={l.full_name}
                      phone={l.phone}
                      email={l.email}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {/* ไม่พบ Leads */}
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    ไม่พบ Leads
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View - Premium Adaptive Grid */}
        <div className="lg:hidden p-4 bg-slate-50/30">
          <AnimatePresence mode="popLayout">
            <m.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {leads.map((l, idx) => {
                const isNew =
                  l.created_at &&
                  differenceInHours(new Date(), new Date(l.created_at)) < 24;
                const initials = l.full_name
                  ? l.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "??";
                const selected = isSelected(l.id);
                const aiScore = (l as any).ai_score ?? 0;

                return (
                  <m.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: idx * 0.02,
                    }}
                    className={cn(
                      "group relative flex flex-col h-full bg-white rounded-[32px] border transition-all duration-300",
                      selected
                        ? "border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/20"
                        : "border-slate-200/60 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50",
                    )}
                  >
                    {/* Card Header: Selection & Identity */}
                    <div className="p-5 pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center h-5 w-5 shrink-0 z-10">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleSelect(l.id)}
                              className="rounded-full h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                          </div>

                          <Avatar className="h-10 w-10 border-2 border-slate-50 shadow-sm shrink-0">
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/protected/leads/${l.id}`}
                                className="text-base font-semibold text-slate-900 hover:text-blue-700 hover:underline transition-colors line-clamp-1"
                              >
                                {l.full_name}
                              </Link>
                              {isNew && (
                                <Badge className="h-4 px-1.5 text-[9px] bg-amber-500 hover:bg-amber-600 border-0 font-semibold uppercase tracking-tighter animate-pulse">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                              <FaCalendar className="h-2.5 w-2.5" />
                              {l.created_at
                                ? format(new Date(l.created_at), "d MMM yy", {
                                    locale: th,
                                  })
                                : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <LeadRowActions
                            id={l.id}
                            fullName={l.full_name}
                            phone={l.phone}
                            email={l.email}
                          />
                        </div>
                      </div>

                      {/* Status & Badges */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-5 text-[10px] px-2 font-semibold border-blue-100 text-blue-600 bg-blue-50/50 uppercase tracking-tighter"
                        >
                          {safeEnumLabel(LEAD_STAGE_LABELS as any, l.stage)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 text-[10px] px-2 font-semibold border-0 uppercase tracking-tighter",
                            aiScore >= 50
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-50 text-blue-700",
                          )}
                        >
                          Score: {aiScore}
                        </Badge>
                        {isMultiTenant && (l as any).tenants?.name && (
                          <Badge className="h-5 text-[10px] px-2 bg-slate-100 text-slate-500 hover:bg-slate-100 border-0 font-semibold uppercase tracking-tighter">
                            {(l as any).tenants.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100/80 mx-5" />

                    {/* Card Body: Contact Pills */}
                    <div className="p-5 pt-4 flex-1">
                      <div className="grid grid-cols-1 gap-2">
                        {/* Phone Pill */}
                        <a
                          href={l.phone ? `tel:${l.phone}` : "#"}
                          className={cn(
                            "flex items-center justify-between min-h-[46px] w-full px-4 rounded-2xl transition-all font-semibold text-sm",
                            l.phone
                              ? "bg-blue-50/50 text-blue-700 hover:bg-blue-600 hover:text-white shadow-xs"
                              : "bg-slate-50 text-slate-300 pointer-events-none cursor-not-allowed",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <FaPhone className="h-3.5 w-3.5 mb-0.5" />
                            <span>{l.phone || "ไม่มีเบอร์โทร"}</span>
                          </div>
                          {l.phone && (
                            <FaChevronRight className="h-3 w-3 opacity-50" />
                          )}
                        </a>

                        <div className="grid grid-cols-2 gap-2">
                          {/* LINE / Email Pills - Hardened Layout */}
                          <div
                            className={cn(
                              "flex items-center justify-center gap-2 min-h-[46px] rounded-2xl transition-all font-semibold text-sm px-2",
                              (l as any).line_id
                                ? "bg-emerald-50/50 text-emerald-700 border border-emerald-100/50"
                                : "bg-slate-50 text-slate-300 border border-slate-100",
                            )}
                          >
                            <FaLine className="h-4 w-4 shrink-0 mb-0.5" />
                            <span className="truncate">
                              {(l as any).line_id || "LINE"}
                            </span>
                          </div>

                          <a
                            href={l.email ? `mailto:${l.email}` : "#"}
                            className={cn(
                              "flex items-center justify-center gap-2 min-h-[46px] rounded-2xl transition-all font-semibold text-sm px-2",
                              l.email
                                ? "bg-indigo-50/50 text-indigo-700 border border-indigo-100/50 hover:bg-indigo-600 hover:text-white"
                                : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed",
                            )}
                          >
                            <FaEnvelope className="h-4 w-4 shrink-0 mb-0.5" />
                            <span className="truncate">Email</span>
                          </a>
                        </div>

                        {/* Property Link */}
                        {(l as any).property && (
                          <Link
                            href={`/properties/${(l as any).property.id}`}
                            target="_blank"
                            className="flex items-center gap-3 min-h-[46px] w-full px-4 rounded-2xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-semibold text-xs border border-slate-100 hover:border-blue-100"
                          >
                            <FaBuilding className="h-3.5 w-3.5 shrink-0 opacity-40" />
                            <span className="truncate">
                              {(l as any).property.title}
                            </span>
                          </Link>
                        )}
                      </div>

                      {/* Notes Section */}
                      {l.note && (
                        <div className="mt-3 p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl text-[11px] text-slate-500 italic flex gap-2">
                          <FaNoteSticky className="h-3 w-3 text-slate-300 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">
                            {l.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </m.div>
                );
              })}
            </m.div>
          </AnimatePresence>
          {leads.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-[32px] border border-dashed border-slate-200 mt-4">
              ไม่พบข้อมูลลูกค้ามุ่งหวัง
            </div>
          )}
        </div>
      </div>

      <PaginationControls
        totalCount={totalCount}
        pageSize={20}
        currentPage={currentPage}
      />
    </div>
  );
}
