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
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  // filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<
    string | undefined
  >(undefined);
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(
    undefined
  );
  // reloadKey increments to force a refresh of the data effect (useful after create/edit/delete)
  const [reloadKey, setReloadKey] = useState(0);

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
                      toast.info("การกรองด้วย 'ไม่ผูกทรัพย์' ยังไม่รองรับ")
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
              <TableHead className="font-semibold">ทรัพย์</TableHead>
              <TableHead className="font-semibold">ลีด</TableHead>
              <TableHead className="font-semibold">ราคา</TableHead>
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
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Handshake className="h-12 w-12 text-slate-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        {hasActiveFilters ? "ไม่พบดีลที่ค้นหา" : "ยังไม่มีดีล"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {hasActiveFilters
                          ? "ลองปรับตัวกรองใหม่"
                          : "สร้างดีลแรกของคุณเพื่อเริ่มต้น"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Link
                      href={`/protected/properties/${deal.property_id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {deal.property?.title || "-"}
                    </Link>
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
                    {deal.deal_type === "RENT"
                      ? deal.property?.rental_price
                        ? `${deal.property.rental_price.toLocaleString()} ฿/เดือน`
                        : "-"
                      : deal.property?.price
                      ? `${deal.property.price.toLocaleString()} ฿`
                      : "-"}
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
