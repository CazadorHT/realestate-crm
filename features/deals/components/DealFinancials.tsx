"use client";

import { useState } from "react";
import { format, differenceInMonths } from "date-fns";
import { th } from "date-fns/locale";
import {
  BadgeCent,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
  FileDown,
  Share2,
  Trash2,
} from "lucide-react";
import type { Database } from "@/lib/database.types";
import { DealCommission } from "../types";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Deal = Database["public"]["Tables"]["deals"]["Row"];

interface DealFinancialsProps {
  deal: Deal;
  isRent: boolean;
  commissions: DealCommission[];
}

export function DealFinancials({
  deal,
  isRent,
  commissions: initialCommissions,
}: DealFinancialsProps) {
  const [commissions, setCommissions] = useState(initialCommissions);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if ((deal.commission_amount || 0) <= 0) {
      toast.error("กรุณาระบุยอดคอมมิชชั่นรวมก่อนคำนวณส่วนแบ่ง");
      return;
    }
    setCalculating(true);
    try {
      const res = await calculateAndSaveCommissionsAction(deal.id);
      if (res.success) {
        toast.success("คำนวณสัดส่วนคอมมิชชั่นเรียบร้อยแล้ว");
        // In a real app, we'd probably re-fetch or use the returned data
        // For now, let's suggest a refresh or assume the user will see it on next load
        // Actually, since this is a client component, we should ideally fetch again
        window.location.reload();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการคำนวณ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setCalculating(false);
    }
  };

  const handleExportPdf = async (commissionId: string) => {
    const toastId = toast.loading("กำลังเตรียมไฟล์ PDF...");
    try {
      const res = await exportCommissionPdfAction(commissionId);
      if (res.success && res.data) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.data}`;
        link.download = res.filename || "commission-statement.pdf";
        link.click();
        toast.success("ดาวน์โหลด PDF สำเร็จ", { id: toastId });
      } else {
        toast.error(res.message || "ล้มเหลวในการสร้าง PDF", { id: toastId });
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด", { id: toastId });
    }
  };

  const handleSendLine = async (commissionId: string) => {
    const toastId = toast.loading("กำลังส่งไปยัง LINE...");
    try {
      const res = await sendCommissionToLineAction(commissionId);
      if (res.success) {
        toast.success("ส่งเรียบร้อยแล้ว", { id: toastId });
      } else {
        toast.error(res.message || "ล้มเหลวในการส่ง", { id: toastId });
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการส่ง", { id: toastId });
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
              ค่าคอมมิชชั่นทั้งหมด
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            ฿{(deal.commission_amount || 0).toLocaleString()}
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
                                {comm.agent.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 leading-tight">
                                {comm.agent.full_name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 w-fit px-1 gap-1 text-slate-500 border-slate-200 mt-0.5"
                              >
                                {getRoleIcon(comm.role)}
                                {getRoleLabel(comm.role)}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center border shadow-xs ${
                                comm.role === "AGENCY"
                                  ? "bg-indigo-50 text-indigo-500 border-indigo-100"
                                  : comm.role === "TEAM_POOL"
                                    ? "bg-amber-50 text-amber-500 border-amber-100"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                            >
                              {getRoleIcon(comm.role)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 leading-tight">
                                {getRoleLabel(comm.role)}
                              </span>
                              {comm.role === "AGENCY" && (
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
                      ฿{comm.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-500 font-medium">
                      {comm.wht_amount > 0
                        ? `-฿${comm.wht_amount.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-base font-bold text-emerald-600">
                        ฿{comm.net_amount.toLocaleString()}
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
