"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
} from "lucide-react";
import { differenceInHours } from "date-fns";
import { formatDate, cn } from "@/lib/utils";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteRentalContractsAction } from "@/features/contracts/bulk-actions";
import { toast } from "sonner";

interface RentalContractWithRelations {
  id: string;
  contract_number: string;
  tenant_name: string;
  tenant_phone: string | null;
  tenant_email: string | null;
  start_date: string;
  end_date: string;
  duration_months: number | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  deal_id: string;
  deal: {
    id: string;
    property: { title: string } | null;
  } | null;
  created_at?: string;
}

function getContractStatus(endDate: string) {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "expired" as const,
      label: "หมดอายุ",
      days: Math.abs(diffDays),
    };
  } else if (diffDays <= 30) {
    return {
      status: "expiring-soon" as const,
      label: "ใกล้หมดอายุ",
      days: diffDays,
    };
  } else {
    return { status: "active" as const, label: "ใช้งานอยู่", days: diffDays };
  }
}

interface ContractsTableProps {
  contracts: RentalContractWithRelations[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const allIds = useMemo(() => contracts.map((c) => c.id), [contracts]);
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
    const result = await bulkDeleteRentalContractsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="สัญญา"
      />

      {/* Desktop Table */}
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
              <TableHead>เลขที่สัญญา</TableHead>
              <TableHead>ทรัพย์สิน</TableHead>
              <TableHead>ผู้เช่า</TableHead>
              <TableHead>ระยะเวลา</TableHead>
              <TableHead>ค่าเช่า/เดือน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts && contracts.length > 0 ? (
              contracts.map((contract) => {
                const statusInfo = getContractStatus(contract.end_date);
                const propertyTitle =
                  contract.deal?.property?.title || "ไม่ระบุทรัพย์สิน";

                return (
                  <TableRow
                    key={contract.id}
                    className={`hover:bg-slate-50/50 ${
                      isSelected(contract.id) ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <TableCell className="w-[50px]">
                      <Checkbox
                        checked={isSelected(contract.id)}
                        onCheckedChange={() => toggleSelect(contract.id)}
                        aria-label={`เลือก ${contract.contract_number}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-mono text-sm">
                            {contract.contract_number}
                          </span>
                        </div>
                        {contract.created_at &&
                          differenceInHours(
                            new Date(),
                            new Date(contract.created_at),
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
                        href={`/protected/deals/${contract.deal_id}`}
                        className="text-blue-600 hover:underline font-medium line-clamp-1"
                      >
                        {propertyTitle}
                      </Link>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Deal: {contract.deal_id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{contract.tenant_name}</div>
                      <div className="text-xs text-slate-500">
                        {contract.tenant_phone || contract.tenant_email || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(contract.start_date)}
                      </div>
                      <div className="text-sm">
                        {formatDate(contract.end_date)}
                      </div>
                      {contract.duration_months && (
                        <div className="text-xs text-slate-500 mt-1">
                          {contract.duration_months} เดือน
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.monthly_rent ? (
                        <div className="font-medium text-slate-900">
                          {new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                            maximumFractionDigits: 0,
                          }).format(contract.monthly_rent)}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {contract.deposit_amount && (
                        <div className="text-xs text-slate-500">
                          ประกัน:{" "}
                          {new Intl.NumberFormat("th-TH", {
                            maximumFractionDigits: 0,
                          }).format(contract.deposit_amount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {statusInfo.status === "expired" ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      ) : statusInfo.status === "expiring-soon" ? (
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="gap-1 bg-orange-50 text-orange-700 border-orange-200"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                          <div className="text-xs text-orange-600 font-medium">
                            อีก {statusInfo.days} วัน
                          </div>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/protected/deals/${contract.deal_id}?tab=contract`}
                        >
                          ดูรายละเอียด <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-auto py-0 border-0">
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-mobile"
              checked={isAllSelected}
              onCheckedChange={() => toggleSelectAll(allIds)}
            />
            <label
              htmlFor="select-all-mobile"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              เลือกทั้งหมด
            </label>
          </div>
          <p className="text-[10px] font-medium text-slate-400">
            Displaying {contracts.length} contracts
          </p>
        </div>

        {contracts && contracts.length > 0 ? (
          contracts.map((contract) => {
            const statusInfo = getContractStatus(contract.end_date);
            const propertyTitle =
              contract.deal?.property?.title || "ไม่ระบุทรัพย์สิน";
            const isSel = isSelected(contract.id);

            return (
              <div
                key={contract.id}
                className={cn(
                  "relative group rounded-3xl border transition-all duration-300 overflow-hidden",
                  isSel
                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                    : "bg-white border-slate-100 shadow-xs hover:border-slate-300",
                )}
              >
                {/* Selection Checkbox (Top Right) */}
                <div className="absolute top-4 right-4 z-10">
                  <Checkbox
                    checked={isSel}
                    onCheckedChange={() => toggleSelect(contract.id)}
                    className="h-5 w-5 rounded-md border-slate-300"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4 pr-10">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        statusInfo.status === "expired"
                          ? "bg-red-50 text-red-500"
                          : statusInfo.status === "expiring-soon"
                            ? "bg-orange-50 text-orange-500"
                            : "bg-blue-50 text-blue-500",
                      )}
                    >
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-tight">
                          #{contract.contract_number}
                        </span>
                        {contract.created_at &&
                          differenceInHours(
                            new Date(),
                            new Date(contract.created_at),
                          ) < 24 && (
                            <span className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black">
                              NEW
                            </span>
                          )}
                      </div>
                      <Link
                        href={`/protected/deals/${contract.deal_id}`}
                        className="block font-bold text-slate-800 text-sm leading-tight hover:text-blue-600 transition-colors line-clamp-2"
                      >
                        {propertyTitle}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ผู้เช่า
                      </p>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {contract.tenant_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ค่าเช่า/เดือน
                      </p>
                      <p className="text-xs font-black text-blue-600">
                        {contract.monthly_rent
                          ? new Intl.NumberFormat("th-TH").format(
                              contract.monthly_rent,
                            )
                          : "-"}{" "}
                        ฿
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ระยะเวลา
                      </p>
                      <p className="text-[10px] font-semibold text-slate-600">
                        {formatDate(contract.start_date)} -{" "}
                        {formatDate(contract.end_date)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        สถานะ
                      </p>
                      {statusInfo.status === "expired" ? (
                        <div className="inline-flex items-center gap-1.5 text-red-600">
                          <XCircle className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-tight">
                            {statusInfo.label}
                          </span>
                        </div>
                      ) : statusInfo.status === "expiring-soon" ? (
                        <div className="inline-flex items-center gap-1.5 text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-tight">
                            {statusInfo.label} (อีก {statusInfo.days} ว.)
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="text-[10px] font-black uppercase tracking-tight">
                            {statusInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between gap-3">
                    <div className="flex -space-x-1">
                      {/* Placeholder for tenant avatar or similar if needed */}
                      <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                        <Users className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-9 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-all"
                    >
                      <Link
                        href={`/protected/deals/${contract.deal_id}?tab=contract`}
                      >
                        ดูรายละเอียด{" "}
                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-2">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white py-12 px-6 sm:p-12 my-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-slate-400 rounded-xl rotate-12" />
        <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-slate-400 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 border-4 border-slate-400 rounded-lg -rotate-6" />
      </div>

      <div className="relative flex flex-col items-center justify-center text-center space-y-6">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-150" />
          <div className="relative p-6 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/30">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            ยังไม่มีสัญญาเช่าในระบบ
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            การสร้างสัญญาเช่าต้องมีดีลที่มีสถานะ{" "}
            <span className="font-semibold text-emerald-600">"สำเร็จ"</span>{" "}
            เท่านั้น กรุณาไปหน้าดีลเพื่อปิดการขาย/เช่าก่อน
          </p>
        </div>

        {/* Button */}
        <Button
          asChild
          className="mt-2 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 rounded-xl h-11"
        >
          <Link href="/protected/deals">
            ไปหน้าดีล
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
