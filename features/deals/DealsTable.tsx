"use client";

import { useMemo } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Handshake } from "lucide-react";
import { toast } from "sonner";

import { DealWithProperty, DealPropertyOption } from "./types";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteDealsAction, getAllDealIdsAction } from "@/features/deals/bulk-actions";
import { exportDealsAction } from "@/features/deals/export-action";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

import { useDealsTable } from "./hooks/useDealsTable";
import { DealsFilters } from "./components/DealsFilters";
import { DealsTableRow } from "./components/DealsTableRow";
import { DealsMobileCard } from "./components/DealsMobileCard";
import { DealsPagination } from "./components/DealsPagination";

interface DealsTableProps {
  initialData?: DealWithProperty[];
  initialCount?: number;
  initialPage?: number;
  pageSize?: number;
  properties?: DealPropertyOption[];
  timeRange?: string;
}

export function DealsTable({
  initialData = [],
  initialCount = 0,
  initialPage = 1,
  pageSize = 20,
  properties = [],
  timeRange: initialTimeRange = "all",
}: DealsTableProps) {
  const {
    q,
    setQ,
    page,
    setPage,
    data,
    count,
    loading,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedLeadId,
    setSelectedLeadId,
    totalPages,
    hasActiveFilters,
    refresh,
    timeRange,
    debouncedQ,
  } = useDealsTable(initialData, initialCount, initialPage, pageSize, initialTimeRange);

  const allIds = useMemo(() => data.map((d) => d.id), [data]);
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

  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const handleSelectAllGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const result = await getAllDealIdsAction({
        q: debouncedQ,
        property_id: selectedPropertyId,
        lead_id: selectedLeadId,
        timeRange,
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
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteDealsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-6">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onExport={() => exportDealsAction(Array.from(selectedIds))}
        entityName="ดีล"
      />

      {/* Global Selection Indicator */}
      {isAllSelected && selectedCount < count && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>เลือกทั้งหมด {selectedCount} ดีลในหน้านี้แล้ว</span>
          </div>
          <button
            onClick={handleSelectAllGlobal}
            disabled={isGlobalLoading}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            {isGlobalLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            เลือกทั้งหมด {count} ดีลในระบบ
          </button>
        </div>
      )}

      {selectedCount === count && count > data.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>คุณได้เลือกทั้งหมด <strong>{count}</strong> ดีลในระบบแล้ว (ทุกหน้า)</span>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all"
          >
            ยกเลิกการเลือก
          </button>
        </div>
      )}

      <DealsFilters
        q={q}
        setQ={setQ}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        selectedLeadId={selectedLeadId}
        setSelectedLeadId={setSelectedLeadId}
        hasActiveFilters={hasActiveFilters}
        onFilterChange={() => setPage((p) => 1)}
      />

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ประเภท
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ทรัพย์
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ลีด
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ราคา{" "}
                    <span className="text-[9px] font-normal text-slate-400">
                      (เดิม)
                    </span>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ค่าคอม
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ระยะสัญญา
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    วันที่
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-auto py-0 border-0">
                      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-12 my-4">
                        <div className="relative flex flex-col items-center justify-center text-center space-y-6">
                          <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
                            <div className="relative p-6 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/30">
                              <Handshake className="h-12 w-12 text-white" />
                            </div>
                          </div>
                          <div className="space-y-2 max-w-md">
                            <h3 className="text-2xl font-bold text-slate-800">
                              {hasActiveFilters
                                ? "ไม่พบดีลที่ค้นหา"
                                : "ยังไม่มีดีลในระบบ"}
                            </h3>
                            <p className="text-slate-500 leading-relaxed">
                              {hasActiveFilters
                                ? "ลองปรับตัวกรองใหม่หรือค้นหาด้วยคำอื่น"
                                : "เริ่มต้นสร้างดีลแรกของคุณเพื่อติดตามการขายและการเช่าทรัพย์"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((deal) => (
                    <DealsTableRow
                      key={deal.id}
                      deal={deal}
                      isSelected={isSelected(deal.id)}
                      onToggleSelect={toggleSelect}
                      properties={properties}
                      onRefresh={refresh}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden divide-y divide-slate-100">
            {data.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                {hasActiveFilters ? "ไม่พบดีลที่ค้นหา" : "ยังไม่มีดีลในระบบ"}
              </div>
            ) : (
              data.map((deal) => (
                <DealsMobileCard
                  key={deal.id}
                  deal={deal}
                  isSelected={isSelected(deal.id)}
                  onToggleSelect={toggleSelect}
                  properties={properties}
                  onRefresh={refresh}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <DealsPagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        pageSize={pageSize}
        count={count}
      />
    </div>
  );
}
