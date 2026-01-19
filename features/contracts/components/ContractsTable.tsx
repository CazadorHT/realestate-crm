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
} from "lucide-react";
import { differenceInHours } from "date-fns";
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

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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
                            new Date(contract.created_at)
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
                        {new Date(contract.start_date).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-sm">
                        {new Date(contract.end_date).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
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
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium">ไม่มีสัญญาเช่าในระบบ</p>
                    <p className="text-xs text-slate-400">
                      สร้างสัญญาใหม่จากหน้า Deals
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
