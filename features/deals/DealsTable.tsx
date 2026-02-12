"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { DealWithProperty, DealPropertyOption } from "./types";
import { DealFormDialog } from "./components/DealFormDialog";
import { DeleteDealButton } from "./components/DeleteDealButton";
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { LeadCombobox } from "./components/LeadCombobox";
import { differenceInHours } from "date-fns";
import { formatDate } from "@/lib/utils";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteDealsAction } from "@/features/deals/bulk-actions";
import { exportDealsAction } from "@/features/deals/export-action";
import { toast } from "sonner";

interface DealsTableProps {
  initialData?: DealWithProperty[];
  initialCount?: number;
  initialPage?: number;
  pageSize?: number;
  properties?: DealPropertyOption[];
}

export function DealsTable({
  initialData = [],
  initialCount = 0,
  initialPage = 1,
  pageSize = 20,
  properties = [],
}: DealsTableProps) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(initialData);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Sync state with props when Server Components re-render (router.refresh)
  useEffect(() => {
    setData(initialData);
    setCount(initialCount);
  }, [initialData, initialCount]);
  // filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<
    string | undefined
  >(undefined);
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(
    undefined,
  );
  // reloadKey increments to force a refresh of the data effect (useful after create/edit/delete)
  const [reloadKey, setReloadKey] = useState(0);

  // Bulk selection
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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteDealsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      setReloadKey((k) => k + 1);
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (selectedPropertyId !== undefined)
        params.set("property_id", selectedPropertyId);
      if (selectedLeadId !== undefined) params.set("lead_id", selectedLeadId);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!mounted) return;
      if (res.ok) {
        const payload = await res.json();
        setData(payload.data ?? []);
        setCount(payload.count ?? 0);
      } else {
        const text = await res.text();
        console.error("/api/deals fetch error:", res.status, text);
        // show a user-visible error
        try {
          const { toast } = await import("sonner");
          toast.error("ไม่สามารถค้นหาดีลได้ ลองโหลดหน้าซ้ำหรือแจ้งผู้ดูแลระบบ");
        } catch (e) {
          // ignore
        }
        setData([]);
        setCount(0);
      }
      setLoading(false);
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [
    debouncedQ,
    page,
    pageSize,
    reloadKey,
    selectedPropertyId,
    selectedLeadId,
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const hasActiveFilters = useMemo(
    () => !!(selectedPropertyId || selectedLeadId || debouncedQ),
    [selectedPropertyId, selectedLeadId, debouncedQ],
  );

  const StatusBadge = React.memo(({ status }: { status: string }) => {
    const styleMap: Record<
      string,
      { bg: string; text: string; icon?: string }
    > = {
      NEGOTIATING: { bg: "bg-blue-50", text: "text-blue-700 border-blue-200" },
      SIGNED: { bg: "bg-purple-50", text: "text-purple-700 border-purple-200" },
      CLOSED_WIN: {
        bg: "bg-green-50",
        text: "text-green-700 border-green-200",
      },
      CLOSED_LOSS: { bg: "bg-red-50", text: "text-red-700 border-red-200" },
      CANCELLED: { bg: "bg-slate-50", text: "text-slate-700 border-slate-200" },
    };

    const labelMap: Record<string, string> = {
      NEGOTIATING: "กำลังต่อรอง",
      SIGNED: "เซ็นสัญญา",
      CLOSED_WIN: "สำเร็จ",
      CLOSED_LOSS: "ไม่สำเร็จ",
      CANCELLED: "ยกเลิก",
    };

    const style = styleMap[status] || {
      bg: "bg-slate-50",
      text: "text-slate-700 border-slate-200",
    };

    return (
      <Badge
        variant="outline"
        className={`${style.bg} ${style.text} font-medium`}
      >
        {labelMap[status] || status}
      </Badge>
    );
  });
  StatusBadge.displayName = "StatusBadge";

  return (
    <div className="space-y-6">
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onExport={() => exportDealsAction(Array.from(selectedIds))}
        entityName="ดีล"
      />

      {/* Filters Section */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">ตัวกรอง</h3>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-2 bg-blue-100 text-blue-700"
            >
              {[selectedPropertyId, selectedLeadId, q].filter(Boolean).length}{" "}
              active
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Property Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <PropertyCombobox
                value={selectedPropertyId ?? null}
                onChange={(id) => {
                  if (id === null) {
                    setSelectedPropertyId(undefined);
                    import("sonner").then(({ toast }) =>
                      toast.info("การกรองด้วย 'ไม่ผูกทรัพย์' ยังไม่รองรับ"),
                    );
                  } else {
                    setSelectedPropertyId(id ?? undefined);
                  }
                  setPage(1);
                }}
                placeholder="เลือกทรัพย์..."
              />
            </div>
            {selectedPropertyId && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedPropertyId(undefined)}
                className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
                title="ลบตัวกรอง"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Lead Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <LeadCombobox
                value={selectedLeadId ?? null}
                onChange={(id) => {
                  setSelectedLeadId(id ?? undefined);
                  setPage(1);
                }}
                placeholder="เลือกลีด..."
              />
            </div>
            {selectedLeadId && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedLeadId(undefined)}
                className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
                title="ลบตัวกรอง"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
            {q && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQ("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
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
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    ประเภท
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    ทรัพย์
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    ลีด
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    ราคา{" "}
                    <span className="text-xs font-normal text-slate-400">
                      (เดิม)
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    ค่าคอม
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    ระยะสัญญา
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    วันที่
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                    สถานะ
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 whitespace-nowrap">
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
                    <TableRow
                      key={deal.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isSelected(deal.id) ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <TableCell className="w-[50px]">
                        <Checkbox
                          checked={isSelected(deal.id)}
                          onCheckedChange={() => toggleSelect(deal.id)}
                          aria-label={`เลือก ${deal.property?.title || deal.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deal.deal_type === "RENT" ? "secondary" : "default"
                          }
                          className="font-normal w-[60px] justify-center"
                        >
                          {deal.deal_type === "RENT" ? "เช่า" : "ขาย"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 max-w-[300px]">
                          <Link
                            href={`/protected/properties/${deal.property_id}`}
                            className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors line-clamp-2"
                          >
                            {deal.property?.title || "-"}
                          </Link>
                          {deal.created_at &&
                            differenceInHours(
                              new Date(),
                              new Date(deal.created_at),
                            ) < 24 && (
                              <Badge className="h-4 px-1 text-[9px] bg-amber-500 hover:bg-amber-600 font-bold border-0">
                                NEW
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/protected/leads/${deal.lead_id}`}
                          className="text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors line-clamp-1"
                        >
                          {deal.lead?.full_name || "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        <div className="flex flex-col items-start gap-0.5">
                          {(() => {
                            const isRent = deal.deal_type === "RENT";
                            const current =
                              (isRent
                                ? deal.property?.rental_price
                                : deal.property?.price) || 0;
                            const original =
                              (isRent
                                ? deal.property?.original_rental_price
                                : deal.property?.original_price) || 0;
                            const displayPrice =
                              current === 0 && original > 0
                                ? original
                                : current;
                            const showOriginal =
                              current > 0 && original > current;

                            if (displayPrice === 0) return "-";
                            return (
                              <>
                                <span className="whitespace-nowrap">
                                  {displayPrice.toLocaleString()} ฿
                                </span>
                                {showOriginal && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    {original.toLocaleString()}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {deal.commission_amount ? (
                          <span className="text-green-600 font-semibold whitespace-nowrap">
                            {deal.commission_amount.toLocaleString()} ฿
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {deal.deal_type === "RENT" && deal.duration_months ? (
                          <span className="text-sm whitespace-nowrap">
                            {deal.duration_months} เดือน
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <span className="whitespace-nowrap">
                          {deal.transaction_date
                            ? formatDate(deal.transaction_date)
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={deal.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                            title="ดูรายละเอียด"
                          >
                            <Link href={`/protected/deals/${deal.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          <DealFormDialog
                            leadId={deal.lead_id}
                            properties={properties}
                            deal={deal}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600 cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                            onSuccess={() => {
                              setPage(1);
                              setReloadKey((k) => k + 1);
                            }}
                          />

                          <DeleteDealButton
                            dealId={deal.id}
                            leadId={deal.lead_id}
                            onSuccess={() => {
                              setPage(1);
                              setReloadKey((k) => k + 1);
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {data.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                {hasActiveFilters ? "ไม่พบดีลที่ค้นหา" : "ยังไม่มีดีลในระบบ"}
              </div>
            ) : (
              data.map((deal) => (
                <div
                  key={deal.id}
                  className={`p-4 transition-colors ${
                    isSelected(deal.id) ? "bg-blue-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-3 shrink-0 py-1">
                      <Checkbox
                        checked={isSelected(deal.id)}
                        onCheckedChange={() => toggleSelect(deal.id)}
                      />
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Handshake className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/protected/deals/${deal.id}`}
                              className="font-bold text-slate-900 text-sm hover:underline line-clamp-2"
                            >
                              {deal.property?.title || "ไม่ระบุทรัพย์"}
                            </Link>
                            {deal.created_at &&
                              differenceInHours(
                                new Date(),
                                new Date(deal.created_at),
                              ) < 24 && (
                                <Badge className="h-4 px-1.5 text-[9px] bg-amber-500 hover:bg-amber-600 border-0">
                                  NEW
                                </Badge>
                              )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                deal.deal_type === "RENT"
                                  ? "secondary"
                                  : "default"
                              }
                              className="h-4 text-[9px] px-1.5 font-bold"
                            >
                              {deal.deal_type === "RENT" ? "เช่า" : "ขาย"}
                            </Badge>
                            <StatusBadge status={deal.status} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Link href={`/protected/deals/${deal.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DealFormDialog
                            leadId={deal.lead_id}
                            properties={properties}
                            deal={deal}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                            onSuccess={() => {
                              setPage(1);
                              setReloadKey((k) => k + 1);
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400">ลูกค้า (Lead):</span>
                          <Link
                            href={`/protected/leads/${deal.lead_id}`}
                            className="font-medium text-blue-600 hover:underline line-clamp-1"
                          >
                            {deal.lead?.full_name || "-"}
                          </Link>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400">ราคา:</span>
                          <span className="font-semibold text-slate-900">
                            {(() => {
                              const isRent = deal.deal_type === "RENT";
                              const current =
                                (isRent
                                  ? deal.property?.rental_price
                                  : deal.property?.price) || 0;
                              return current > 0
                                ? `${current.toLocaleString()} ฿`
                                : "-";
                            })()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400">ค่าคอมมิชชั่น:</span>
                          <span className="font-semibold text-green-600">
                            {deal.commission_amount
                              ? `${deal.commission_amount.toLocaleString()} ฿`
                              : "-"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400">วันที่:</span>
                          <span className="text-slate-600">
                            {deal.transaction_date
                              ? formatDate(deal.transaction_date)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination Section */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-sm text-slate-600 text-center sm:text-left">
            แสดง{" "}
            <span className="font-medium text-slate-900">
              {Math.min(count, (page - 1) * pageSize + 1)}
            </span>{" "}
            -{" "}
            <span className="font-medium text-slate-900">
              {Math.min(count, page * pageSize)}
            </span>{" "}
            จาก <span className="font-medium text-slate-900">{count}</span>{" "}
            รายการ
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              ก่อนหน้า
            </Button>
            <div className="h-9 px-4 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
              {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
