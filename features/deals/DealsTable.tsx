"use client";

import { useEffect, useMemo, useState } from "react";
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
import { differenceInHours, format } from "date-fns";
import { th } from "date-fns/locale";
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

  const StatusBadge = ({ status }: { status: string }) => {
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
  };

  const hasActiveFilters = selectedPropertyId || selectedLeadId || q;

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
                value={selectedPropertyId ?? (undefined as any)}
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

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

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
              <TableHead className="font-semibold">ประเภท</TableHead>
              <TableHead className="font-semibold">ทรัพย์</TableHead>
              <TableHead className="font-semibold">ลีด</TableHead>
              <TableHead className="font-semibold">
                ราคา{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (เดิม)
                </span>
              </TableHead>
              <TableHead className="font-semibold">ค่าคอม</TableHead>
              <TableHead className="font-semibold">ระยะสัญญา</TableHead>
              <TableHead className="font-semibold">วันที่</TableHead>
              <TableHead className="font-semibold">สถานะ</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-auto py-0 border-0">
                  {/* Premium Empty State */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-12 my-4">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-10 left-10 w-20 h-20 border-4 border-slate-400 rounded-xl rotate-12" />
                      <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-slate-400 rounded-full" />
                      <div className="absolute top-1/2 left-1/3 w-12 h-12 border-4 border-slate-400 rounded-lg -rotate-6" />
                    </div>

                    <div className="relative flex flex-col items-center justify-center text-center space-y-6">
                      {/* Icon */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
                        <div className="relative p-6 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/30">
                          <Handshake className="h-12 w-12 text-white" />
                        </div>
                      </div>

                      {/* Text */}
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
                  className={`hover:bg-slate-50/50 ${
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
                    <div className="flex flex-col gap-1 max-w-[200px] md:max-w-[400px]">
                      <Link
                        href={`/protected/properties/${deal.property_id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors line-clamp-2 whitespace-normal wrap-break-word"
                      >
                        {deal.property?.title || "-"}
                      </Link>
                      {deal.created_at &&
                        differenceInHours(
                          new Date(),
                          new Date(deal.created_at),
                        ) < 24 && (
                          <div className="w-fit">
                            <div className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                              NEW
                            </div>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/protected/leads/${deal.lead_id}`}
                      className="text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {deal.lead?.full_name || "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    <div className="flex flex-col items-start">
                      {(() => {
                        const isRent = deal.deal_type === "RENT";
                        const rawCurrent = isRent
                          ? deal.property?.rental_price
                          : deal.property?.price;
                        const rawOriginal = isRent
                          ? deal.property?.original_rental_price
                          : deal.property?.original_price;

                        const current = rawCurrent || 0;
                        const original = rawOriginal || 0;

                        // Fallback: If current is 0 but original exists, show original as current
                        // Logic matching Deal Details page
                        const displayPrice =
                          current === 0 && original > 0 ? original : current;
                        const showOriginal = current > 0 && original > current;

                        if (displayPrice === 0 && original === 0) {
                          return "-";
                        }

                        return (
                          <>
                            <span>{displayPrice.toLocaleString()} ฿</span>
                            {showOriginal && (
                              <span className="text-xs text-muted-foreground line-through">
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
                      <span className="text-green-600 font-medium">
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
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {deal.transaction_date
                      ? format(new Date(deal.transaction_date), "d MMM yy", {
                          locale: th,
                        })
                      : "-"}
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
                        className="hover:bg-blue-50 hover:text-blue-600"
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
                            className="hover:bg-purple-50 hover:text-purple-600"
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

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4">
          <div className="text-sm text-slate-600">
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              ก่อนหน้า
            </Button>
            <div className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
              {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
