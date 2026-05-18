"use client";

import { useState } from "react";
import { format, differenceInMonths } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  BadgeCent,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
  FileDown,
  Share2,
  FileText,
} from "lucide-react";
import { Deal, DealCommission, InvoiceRow } from "../types";
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
import { calculateAndSaveCommissionsAction } from "../actions";
import {
  exportCommissionPdfAction,
  sendCommissionToLineAction,
} from "../commission-actions";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DealFinancialsProps {
  deal: Deal;
  isRent: boolean;
  commissions: DealCommission[];
  invoices?: InvoiceRow[];
}

export function DealFinancials({
  deal,
  isRent,
  commissions: initialCommissions,
  invoices = [],
}: DealFinancialsProps) {
  const [commissions, setCommissions] = useState(initialCommissions);
  const [calculating, setCalculating] = useState(false);
  const latestInvoice = invoices[0];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleCalculate = async () => {
    if (!deal?.id) {
      toast.error("รหัสดีลไม่ถูกต้อง (Invalid Deal ID)");
      return;
    }
    if ((deal.commission_total || 0) <= 0) {
      toast.error("กรุณาระบุยอดคอมมิชชั่นรวมก่อนคำนวณส่วนแบ่ง");
      return;
    }
    const processId = startProcess("กำลังคำนวณส่วนแบ่งคอมมิชชั่น", {
      type: "FINANCIAL_CALC"
    });
    setCalculating(true);
    try {
      const res = await calculateAndSaveCommissionsAction(deal.id);
      if (res.success) {
        finishProcess(processId, "SUCCESS", "คำนวณสัดส่วนคอมมิชชั่นเรียบร้อยแล้ว ✨");
        handleSuccessFeedback();
      } else {
        finishProcess(processId, "ERROR", res.message || "เกิดข้อผิดพลาดในการคำนวณ");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      finishProcess(processId, "ERROR", msg);
    } finally {
      setCalculating(false);
    }
  };

  const handleExportPdf = async (commissionId: string) => {
    if (!commissionId) {
      toast.error("รหัสคอมมิชชั่นไม่ถูกต้อง (Invalid Commission ID)");
      return;
    }
    const processId = startProcess("กำลังเตรียมไฟล์ PDF ค่าคอมมิชชั่น", {
      type: "EXPORT"
    });
    try {
      const res = await exportCommissionPdfAction(commissionId);
      if (res.success && res.data) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.data}`;
        link.download = res.filename || "commission-statement.pdf";
        link.click();
        finishProcess(processId, "SUCCESS", "ดาวน์โหลด PDF สำเร็จ ✨");
      } else {
        finishProcess(processId, "ERROR", res.message || "ล้มเหลวในการสร้าง PDF");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดาวน์โหลด";
      finishProcess(processId, "ERROR", msg);
    }
  };

  const handleSendLine = async (commissionId: string) => {
    if (!commissionId) {
      toast.error("รหัสคอมมิชชั่นไม่ถูกต้อง (Invalid Commission ID)");
      return;
    }
    const processId = startProcess("กำลังส่งข้อมูลค่าคอมมิชชั่นไปยัง LINE", {
      type: "SOCIAL_LINE",
    });
    try {
      const res = await sendCommissionToLineAction(commissionId);
      if (res.success) {
        finishProcess(processId, "SUCCESS", "ส่งข้อมูลไปยัง LINE เรียบร้อยแล้ว ✨");
      } else {
        finishProcess(processId, "ERROR", res.message || "ล้มเหลวในการส่ง");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่ง";
      finishProcess(processId, "ERROR", msg);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "LISTING":
        return "Listing Agent";
      case "CLOSING":
        return "Closing Agent";
      case "AGENCY":
        return "Agency";
      case "TEAM_POOL":
        return "Team Pool";
      case "CO_AGENT":
        return "Co-Agent";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "LISTING":
      case "CLOSING":
        return <Users className="h-3 w-3" />;
      case "AGENCY":
        return <Building2 className="h-3 w-3" />;
      case "TEAM_POOL":
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <BadgeCent className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commission Card */}
        <div className="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <BadgeCent className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              ค่าคอมฯ (Base)
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            ฿{(deal.commission_total || 0).toLocaleString()}
          </p>
        </div>

        {/* VAT Card */}
        <div className="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              VAT (7%)
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            ฿{(latestInvoice?.vat_amount || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Invoice Card */}
        <div className="rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-white p-4 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-indigo-600">
              <FileText className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                ยอดเรียกเก็บรวม (Invoice Total)
              </span>
            </div>
            {latestInvoice && (
              <Badge className="bg-indigo-100 text-indigo-600 hover:bg-indigo-100 border-none text-[10px]">
                {latestInvoice.invoice_number || latestInvoice.id?.slice(0, 8)} • {latestInvoice.status}
              </Badge>
            )}
          </div>
          <p className="text-3xl font-bold text-indigo-700">
            ฿{(latestInvoice?.total_amount || latestInvoice?.total || (deal.commission_total || 0)).toLocaleString()}
          </p>
        </div>

        {/* Start Date Card */}
        {deal.transaction_date && (
          <div className="rounded-xl border border-slate-200 bg-linear-to-br from-blue-50 to-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isRent ? "เริ่มสัญญา" : "วันโอน"}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              {format(new Date(deal.transaction_date), "d MMM yy", {
                locale: th,
              })}
            </p>
          </div>
        )}

        {/* End Date Card */}
        {deal.transaction_end_date && (
          <div className="rounded-xl border border-slate-200 bg-linear-to-br from-purple-50 to-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                สิ้นสุดสัญญา
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              {format(new Date(deal.transaction_end_date), "d MMM yy", {
                locale: th,
              })}
            </p>
          </div>
        )}

        {/* Lease Duration Card */}
        {deal.transaction_date && deal.transaction_end_date && (
          <div className="rounded-xl border border-slate-200 bg-linear-to-br from-amber-50 to-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                ระยะเวลาสัญญา
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800">
              {(() => {
                const months = differenceInMonths(
                  new Date(deal.transaction_end_date),
                  new Date(deal.transaction_date),
                );
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                if (years > 0 && remainingMonths > 0) {
                  return `${years} ปี ${remainingMonths} เดือน`;
                } else if (years > 0) {
                  return `${years} ปี`;
                } else {
                  return `${months} เดือน`;
                }
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Commission Breakdown Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm border border-emerald-200">
              <BadgeCent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                การจัดสรรค่าคอมมิชชั่น
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown รายละเอียดการแบ่งส่วนแบ่งและภาษี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {commissions.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCalculate}
                disabled={calculating}
                className="h-9 w-9 p-0 hover:bg-slate-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${calculating ? "animate-spin" : ""}`}
                />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleCalculate}
                disabled={calculating}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
              >
                <RefreshCw
                  className={`h-4 w-4 ${calculating ? "animate-spin" : ""}`}
                />
                {calculating ? "กำลังคำนวณ..." : "คำนวณส่วนแบ่ง"}
              </Button>
            )}
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {commissions.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-6">
                    ผู้รับส่วนแบ่ง
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    %
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                    ยอดก่อนหัก
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                    WHT (3%)
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right pr-6">
                    ยอดสุทธิ (NET)
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right pr-6">
                    Export
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((comm) => (
                  <TableRow
                    key={comm.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        {comm.agent ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-slate-200 shadow-xs">
                              <AvatarImage src={comm.agent.avatar_url || ""} />
                              <AvatarFallback className="text-[10px] bg-slate-100 text-slate-500">
                                {comm.agent.display_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 leading-tight">
                                {comm.agent.display_name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 w-fit px-1 gap-1 text-slate-500 border-slate-200 mt-0.5"
                              >
                                {getRoleIcon(comm.recipient_role)}
                                {getRoleLabel(comm.recipient_role)}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center border shadow-xs ${
                                comm.recipient_role === "AGENCY"
                                  ? "bg-indigo-50 text-indigo-500 border-indigo-100"
                                  : comm.recipient_role === "TEAM_POOL"
                                    ? "bg-amber-50 text-amber-500 border-amber-100"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                            >
                              {getRoleIcon(comm.recipient_role)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 leading-tight">
                                {getRoleLabel(comm.recipient_role)}
                              </span>
                              {comm.recipient_role === "AGENCY" && (
                                <span className="text-[10px] text-slate-400">
                                  หักเข้ากองกลางบริษัท
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-slate-600">
                        {comm.percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700">
                      ฿{(comm.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-500 font-medium">
                      {(comm.tax_amount || 0) > 0
                        ? `-฿${(comm.tax_amount || 0).toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-base font-bold text-emerald-600">
                        ฿{(comm.net_amount || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                          onClick={() => handleExportPdf(comm.id)}
                          title="Export PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600"
                          onClick={() => handleSendLine(comm.id)}
                          title="Send to LINE"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3 bg-slate-50/30">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <BadgeCent className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  ยังไม่มีข้อมูลการจัดสรรค่าคอมฯ
                </p>
                <p className="text-sm text-slate-500 max-w-[280px]">
                  กรุณากดปุ่ม "คำนวณส่วนแบ่ง"
                  เพื่อเริ่มแบ่งคอมมิชชั่นตามมาตรฐานบริษัท
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
