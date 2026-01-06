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
import { Eye, Edit, Trash2, Plus, X } from "lucide-react";
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
    const styleMap: Record<string, string> = {
      NEGOTIATING: "bg-blue-100 text-blue-800",
      SIGNED: "bg-purple-100 text-purple-800",
      CLOSED_WIN: "bg-green-100 text-green-800",
      CLOSED_LOSS: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };

    const labelMap: Record<string, string> = {
      NEGOTIATING: "กำลังต่อรอง",
      SIGNED: "เซ็นสัญญา",
      CLOSED_WIN: "สำเร็จ",
      CLOSED_LOSS: "ไม่สำเร็จ",
      CANCELLED: "ยกเลิก",
    };

    return (
      <Badge
        variant="outline"
        className={`${styleMap[status] || "bg-gray-100"}`}
      >
        {labelMap[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-3xl">
          <div className="flex items-center gap-2 w-72">
            <div className="flex-1">
              <PropertyCombobox
                value={selectedPropertyId ?? (undefined as any)}
                onChange={(id) => {
                  // PropertyCombobox returns `null` for "(General) ไม่ผูกทรัพย์" which is not a supported filter yet.
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
                placeholder="แสดงทรัพย์ทั้งหมด"
              />
            </div>

            {selectedPropertyId ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedPropertyId(undefined)}
                title="ล้าง"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="w-72">
            <LeadCombobox
              value={selectedLeadId ?? null}
              onChange={(id) => {
                setSelectedLeadId(id ?? undefined);
                setPage(1);
              }}
              placeholder="แสดงลีดทั้งหมด"
            />
          </div>

          <div className="flex-1">
            <Input
              placeholder="ค้นหาด้วยชื่อทรัพย์, ชื่อลีด..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DealFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> สร้าง Deal
              </Button>
            }
            leadId={""}
            properties={properties}
            onSuccess={() => {
              setPage(1);
              setDebouncedQ("");
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ทรัพย์</TableHead>
            <TableHead>ลีด</TableHead>
            <TableHead>ราคา</TableHead>
            <TableHead>วันที่</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell>
                <Link
                  href={`/protected/properties/${deal.property_id}`}
                  className="font-medium hover:underline"
                >
                  {deal.property?.title || "-"}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/protected/leads/${deal.lead_id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {deal.lead?.full_name || "-"}
                </Link>
              </TableCell>
              <TableCell>
                {deal.deal_type === "RENT"
                  ? deal.property?.rental_price
                    ? `${deal.property.rental_price.toLocaleString()} ฿/เดือน`
                    : "-"
                  : deal.property?.price
                  ? `${deal.property.price.toLocaleString()} ฿`
                  : "-"}
              </TableCell>
              <TableCell>
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
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/protected/deals/${deal.id}`}
                    className="btn btn-ghost"
                  >
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>

                  <DealFormDialog
                    leadId={deal.lead_id}
                    properties={properties}
                    deal={deal}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                    onSuccess={() => {
                      // refresh after edit
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
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          แสดง {Math.min(count, (page - 1) * pageSize + 1)} -{" "}
          {Math.min(count, page * pageSize)} จาก {count}
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ก่อนหน้า
          </Button>
          <div className="px-2 py-1 rounded border bg-muted text-sm">
            {page} / {totalPages}
          </div>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
}
