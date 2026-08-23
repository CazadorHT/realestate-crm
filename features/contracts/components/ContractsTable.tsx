"use client";

import { useMemo, useState } from "react";
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
  Loader2
} from "lucide-react";
import { differenceInHours } from "date-fns";
import { formatDate, cn } from "@/lib/utils";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteRentalContractsAction, getAllContractIdsAction } from "@/features/contracts/bulk-actions";
import { toast } from "sonner";
import { RentalContractWithRelations } from "../types";
import { useLanguage } from "@/components/providers/LanguageProvider";

function formatLeaseTerm(months: number | null | undefined, isEn: boolean) {
  if (!months) return "";
  if (months % 12 === 0) {
    const years = months / 12;
    return isEn 
      ? `${years} ${years > 1 ? "years" : "year"} (${months} mos)`
      : `${years} ปี (${months} เดือน)`;
  }
  return isEn ? `${months} mos` : `${months} เดือน`;
}

function getMonthsBetween(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  let totalMonths = yearDiff * 12 + monthDiff;
  
  const dayDiff = end.getDate() - start.getDate();
  if (dayDiff >= 27) {
    totalMonths += 1;
  } else if (dayDiff <= -27) {
    totalMonths -= 1;
  }
  return totalMonths > 0 ? totalMonths : 0;
}

function getContractStatus(endDate: string, isEn: boolean) {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "expired" as const,
      label: isEn ? "Expired" : "หมดอายุ",
      days: Math.abs(diffDays),
    };
  } else if (diffDays <= 30) {
    return {
      status: "expiring-soon" as const,
      label: isEn ? "Expiring Soon" : "ใกล้หมดอายุ",
      days: diffDays,
    };
  } else {
    return { 
      status: "active" as const, 
      label: isEn ? "Active" : "ใช้งานอยู่", 
      days: diffDays 
    };
  }
}

interface ContractsTableProps {
  contracts: RentalContractWithRelations[];
  totalCount: number;
  filters?: {
    timeRange?: string;
  };
}

export function ContractsTable({
  contracts,
  totalCount,
  filters = {},
}: ContractsTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleSelectAllGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const result = await getAllContractIdsAction({
        timeRange: filters.timeRange,
      });
      if (result.success && result.ids) {
        toggleSelectAll(result.ids);
        toast.info(
          isEn 
            ? `Selected all ${result.ids.length} contracts` 
            : `เลือกทั้งหมด ${result.ids.length} รายการแล้ว`
        );
      }
    } catch (err) {
      toast.error(isEn ? "Failed to select all" : "ไม่สามารถเลือกทั้งหมดได้");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteRentalContractsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      handleSuccessFeedback();
    } else {
      toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName={isEn ? "contract(s)" : "สัญญา"}
      />

      {/* Global Selection Indicator */}
      {isAllSelected && selectedCount < totalCount && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>{isEn ? `Selected all ${selectedCount} contracts on this page` : `เลือกทั้งหมด ${selectedCount} สัญญาในหน้านี้แล้ว`}</span>
          </div>
          <button
            onClick={handleSelectAllGlobal}
            disabled={isGlobalLoading}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isGlobalLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            {isEn ? `Select all ${totalCount} contracts in system` : `เลือกทั้งหมด ${totalCount} สัญญาในระบบ`}
          </button>
        </div>
      )}

      {selectedCount === totalCount && totalCount > contracts.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              {isEn ? (
                <>You have selected all <strong>{totalCount}</strong> contracts in the system (all pages)</>
              ) : (
                <>คุณได้เลือกทั้งหมด <strong>{totalCount}</strong> สัญญาในระบบแล้ว (ทุกหน้า)</>
              )}
            </span>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            {isEn ? "Deselect" : "ยกเลิกการเลือก"}
          </button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <TableHead>{isEn ? "Contract No." : "เลขที่สัญญา"}</TableHead>
              <TableHead>{isEn ? "Property" : "ทรัพย์สิน"}</TableHead>
              <TableHead>{isEn ? "Tenant" : "ผู้เช่า"}</TableHead>
              <TableHead>{isEn ? "Duration" : "ระยะเวลา"}</TableHead>
              <TableHead>{isEn ? "Rent / Month" : "ค่าเช่า/เดือน"}</TableHead>
              <TableHead>{isEn ? "Status" : "สถานะ"}</TableHead>
              <TableHead className="text-right">{isEn ? "Actions" : "จัดการ"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts && contracts.length > 0 ? (
              contracts.map((contract) => {
                const statusInfo = getContractStatus(contract.end_date, isEn);
                const propertyTitle =
                  contract.deal?.property?.title || (isEn ? "Unspecified Property" : "ไม่ระบุทรัพย์สิน");
                
                // Tenant info (from lead)
                const tenantName =
                  contract.deal?.lead?.full_name ||
                  (isEn ? "Unspecified" : "ไม่ระบุ");

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
                        aria-label={isEn ? `Select ${contract.contract_number}` : `เลือก ${contract.contract_number}`}
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
                      <div className="flex items-center gap-3">
                        <div className="h-20 w-40 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50 relative flex items-center justify-center">
                          {contract.deal?.property?.cover_image_url ? (
                            <img
                              src={contract.deal.property.cover_image_url}
                              alt={propertyTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div
                            onClick={() => {
                              setNavigatingId(`deal-${contract.deal_id}`);
                              router.push(`/protected/deals/${contract.deal_id}`);
                            }}
                            className="text-blue-600 max-w-md hover:underline font-semibold line-clamp-1 cursor-pointer relative"
                          >
                            {navigatingId === `deal-${contract.deal_id}` && (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600 absolute -left-4 top-1" />
                            )}
                            <span className="text-md line-clamp-1 truncate">{propertyTitle}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Deal: {contract.deal_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{tenantName}</div>
                      {(() => {
                        const lead = contract.deal?.lead;
                        if (!lead) return <div className="text-xs text-slate-400">{isEn ? "No contact info" : "ไม่ระบุข้อมูลผู้ติดต่อ"}</div>;
                        const contacts = [
                          { label: "Phone", value: lead.phone },
                          { label: "Email", value: lead.email },
                          { label: "Line", value: lead.line_id, color: "text-[#06C755] font-semibold" },
                          { label: "WeChat", value: lead.wechat_id, color: "text-[#07C160] font-semibold" },
                          { label: "WhatsApp", value: lead.whatsapp, color: "text-[#25D366] font-semibold" },
                          { label: "Facebook", value: lead.facebook, color: "text-[#1877F2] font-semibold" },
                        ].filter(c => !!c.value);

                        if (contacts.length === 0) {
                          return <div className="text-xs text-slate-400">{isEn ? "No phone or email" : "ไม่ได้ระบุเบอร์หรือemail"}</div>;
                        }

                        return (
                          <div className="flex flex-col gap-0.5 mt-1">
                            {contacts.map((c, idx) => (
                              <div key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{c.label}:</span>
                                <span className={c.color || "text-slate-600"}>{c.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(contract.start_date)}
                      </div>
                      <div className="text-sm">
                        {formatDate(contract.end_date)}
                      </div>
                      {(() => {
                        const term = contract.lease_term_months || 
                          (contract.start_date && contract.end_date ? getMonthsBetween(contract.start_date, contract.end_date) : 0);
                        return term > 0 ? (
                          <div className="text-xs mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {formatLeaseTerm(term, isEn)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </TableCell>
                    <TableCell>
                      {contract.rent_price ? (
                        <div className="font-medium text-slate-900">
                          {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                            style: "currency",
                            currency: "THB",
                            maximumFractionDigits: 0,
                          }).format(contract.rent_price)}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {contract.deposit_amount && (
                        <div className="text-xs text-slate-500">
                          {isEn ? "Deposit: " : "ประกัน: "}
                          {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
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
                            {isEn ? `in ${statusInfo.days} days` : `อีก ${statusInfo.days} วัน`}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="cursor-pointer"
                        onClick={() => {
                          setNavigatingId(`view-${contract.id}`);
                          router.push(`/protected/deals/${contract.deal_id}?tab=contract`);
                        }}
                        disabled={navigatingId === `view-${contract.id}`}
                      >
                        {navigatingId === `view-${contract.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>{isEn ? "View Details" : "ดูรายละเอียด"} <ArrowUpRight className="ml-1 h-3 w-3" /></>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-auto py-0 border-0">
                  <EmptyState isEn={isEn} />
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
              aria-label={isEn ? "Select all contracts on this page" : "เลือกสัญญาในหน้านี้ทั้งหมด"}
            />
            <span
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              {isEn ? "Select All" : "เลือกทั้งหมด"}
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">
            {isEn ? `Displaying ${contracts.length} contracts` : `แสดง ${contracts.length} สัญญา`}
          </p>
        </div>

        {contracts && contracts.length > 0 ? (
          contracts.map((contract) => {
            const statusInfo = getContractStatus(contract.end_date, isEn);
            const propertyTitle =
              contract.deal?.property?.title || (isEn ? "Unspecified Property" : "ไม่ระบุทรัพย์สิน");
            const isSel = isSelected(contract.id);
            const tenantName =
              contract.deal?.lead?.full_name ||
              (isEn ? "Unspecified" : "ไม่ระบุ");

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
                    className="h-5 w-5 rounded-md border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4 pr-10">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border overflow-hidden bg-slate-50",
                        statusInfo.status === "expired"
                          ? "bg-red-50 text-red-500"
                          : statusInfo.status === "expiring-soon"
                            ? "bg-orange-50 text-orange-500"
                            : "bg-blue-50 text-blue-500",
                      )}
                    >
                      {contract.deal?.property?.cover_image_url ? (
                        <img
                          src={contract.deal.property.cover_image_url}
                          alt={propertyTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
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
                      <div
                        onClick={() => {
                          setNavigatingId(`m-deal-${contract.deal_id}`);
                          router.push(`/protected/deals/${contract.deal_id}`);
                        }}
                        className="block font-bold text-slate-800 text-sm leading-tight hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer relative"
                      >
                        {navigatingId === `m-deal-${contract.deal_id}` && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute -left-6 top-0.5" />
                        )}
                        {propertyTitle}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isEn ? "Tenant" : "ผู้เช่า"}
                      </p>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {tenantName}
                      </p>
                      {(() => {
                        const lead = contract.deal?.lead;
                        if (!lead) return <div className="text-[9px] text-slate-400">{isEn ? "Unspecified" : "ไม่ระบุ"}</div>;
                        const contacts = [
                          { label: "Phone", value: lead.phone },
                          { label: "Email", value: lead.email },
                          { label: "Line", value: lead.line_id, color: "text-[#06C755] font-semibold" },
                          { label: "WeChat", value: lead.wechat_id, color: "text-[#07C160] font-semibold" },
                          { label: "WhatsApp", value: lead.whatsapp, color: "text-[#25D366] font-semibold" },
                          { label: "Facebook", value: lead.facebook, color: "text-[#1877F2] font-semibold" },
                        ].filter(c => !!c.value);

                        if (contacts.length === 0) {
                          return <div className="text-[9px] text-slate-400">{isEn ? "No contact" : "ไม่ได้ระบุติดต่อ"}</div>;
                        }

                        return (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {contacts.map((c, idx) => (
                              <div key={idx} className="text-[9px] text-slate-500 flex items-center gap-1">
                                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">{c.label}:</span>
                                <span className={`${c.color || "text-slate-600"} truncate max-w-[120px]`}>{c.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isEn ? "Rent / Month" : "ค่าเช่า/เดือน"}
                      </p>
                      <p className="text-xs font-black text-blue-600">
                        {contract.rent_price
                          ? new Intl.NumberFormat(isEn ? "en-US" : "th-TH").format(
                              contract.rent_price,
                            )
                          : "-"}{" "}
                        ฿
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isEn ? "Duration" : "ระยะเวลา"}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-600">
                        {formatDate(contract.start_date)} -{" "}
                        {formatDate(contract.end_date)}
                      </p>
                      {(() => {
                        const term = contract.lease_term_months || 
                          (contract.start_date && contract.end_date ? getMonthsBetween(contract.start_date, contract.end_date) : 0);
                        return term > 0 ? (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {formatLeaseTerm(term, isEn)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isEn ? "Status" : "สถานะ"}
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
                            {statusInfo.label} ({isEn ? `in ${statusInfo.days}d` : `อีก ${statusInfo.days} ว.`})
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
                      <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                        <Users className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                     <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer"
                      onClick={() => {
                        setNavigatingId(`m-view-${contract.id}`);
                        router.push(`/protected/deals/${contract.deal_id}?tab=contract`);
                      }}
                      disabled={navigatingId === `m-view-${contract.id}`}
                    >
                      {navigatingId === `m-view-${contract.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          {isEn ? "View Details" : "ดูรายละเอียด"}{" "}
                          <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-2">
            <EmptyState isEn={isEn} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ isEn }: { isEn: boolean }) {
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
            {isEn ? "No Rental Contracts in System" : "ยังไม่มีสัญญาเช่าในระบบ"}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mx-auto">
            {isEn ? (
              <>Creating a contract requires a deal with <span className="font-semibold text-emerald-600">"Closed Won"</span> status. Please go to Deals page to close the deal first.</>
            ) : (
              <>การสร้างสัญญาเช่าต้องมีดีลที่มีสถานะ <span className="font-semibold text-emerald-600">"สำเร็จ"</span> เท่านั้น กรุณาไปหน้าดีลเพื่อปิดการขาย/เช่าก่อน</>
            )}
          </p>
        </div>

        {/* Button */}
        <Button
          asChild
          className="mt-2 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 rounded-xl h-11 cursor-pointer"
        >
          <Link href="/protected/deals">
            {isEn ? "Go to Deals" : "ไปหน้าดีล"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

