"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Handshake, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { DealWithProperty, DealPropertyOption } from "./types";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteDealsAction, getAllDealIdsAction } from "@/features/deals/bulk-actions";
import { exportDealsAction } from "@/features/deals/export-action";
import { useDealsTable } from "./hooks/useDealsTable";
import { DealsFilters } from "./components/DealsFilters";
import { DealsTableRow } from "./components/DealsTableRow";
import { DealsMobileCard } from "./components/DealsMobileCard";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface DealsTableProps {
  initialData?: DealWithProperty[];
  initialCount?: number;
  initialPage?: number;
  pageSize?: number;
  properties?: DealPropertyOption[];
  timeRange?: string;
}

function DealsCardSkeleton() {
  return (
    <div className="border border-slate-100 rounded-2xl bg-white p-0 overflow-hidden shadow-sm animate-in fade-in duration-500">
      <Skeleton className="aspect-6/3 w-full rounded-none" />
      <div className="p-3 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 rounded-lg opacity-60" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg opacity-80" />
        </div>
        <div className="h-px bg-slate-50" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[120px] rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>
    </div>
  );
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
    dealType,
    setDealType,
    dealStatus,
    setDealStatus,
    propertyType,
    setPropertyType,
    listingType,
    setListingType,
    totalPages,
    hasActiveFilters,
    refresh,
    timeRange,
    debouncedQ,
    stats,
    orderBy,
    setOrderBy,
    orderDirection,
    setOrderDirection,
  } = useDealsTable(initialData, initialCount, initialPage, pageSize, initialTimeRange);

  const allIds = useMemo(() => data.map((d: DealWithProperty) => d.id), [data]);
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
        deal_type: dealType,
        status: dealStatus,
        property_type: propertyType,
        listing_type: listingType,
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

  const [isTransitionPending, startTransition] = useTransition();

  const handleBulkDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkDeleteDealsAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
          refresh();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
        resolve();
      });
    });
  };

  return (
    <div className="space-y-6">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onExport={() => exportDealsAction(Array.from(selectedIds))}
        entityName="ดีล"
        className={isTransitionPending ? "opacity-50 pointer-events-none" : ""}
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
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2"
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
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all"
          >
            ยกเลิกการเลือก
          </button>
        </div>
      )}

      <DealsFilters
        q={q}
        setQ={setQ}
        dealType={dealType}
        setDealType={setDealType}
        dealStatus={dealStatus}
        setDealStatus={setDealStatus}
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        hasActiveFilters={hasActiveFilters}
        totalCount={count}
        stats={stats}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        orderDirection={orderDirection}
        setOrderDirection={setOrderDirection}
        onFilterChange={refresh}
        onClearAll={() => {
          setQ("");
          setDealType(undefined);
          setDealStatus(undefined);
          setPropertyType(undefined);
          setPage(1);
          refresh();
        }}
      />

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div className="lg:border lg:border-slate-200 lg:rounded-lg lg:overflow-hidden lg:bg-white lg:shadow-sm">
          <div className="hidden xl:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ประเภท
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ทรัพย์
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ลีด
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ราคา{" "}
                    <span className="text-[9px] font-normal text-slate-400">
                      (เดิม)
                    </span>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ค่าคอม
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    ระยะสัญญา
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    วันที่
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
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
                            <h3 className="text-2xl font-semibold text-slate-800">
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
                  data.map((deal: DealWithProperty) => (
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

          <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-auto overflow-y-scroll p-1 no-scrollbar min-h-[400px]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <DealsCardSkeleton key={i} />
              ))
              ) : (
                data.map((deal: DealWithProperty, index: number) => (
                  <DealsMobileCard
                    key={deal.id}
                    index={index + 1}
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

      <PaginationControls
        totalCount={count}
        pageSize={pageSize}
        currentPage={page}
      />
    </div>
  );
}
