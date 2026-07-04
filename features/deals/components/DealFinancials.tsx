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
  Plus,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { calculateAndSaveCommissionsAction, updateDealCommissionsAction } from "../actions";
import {
  exportCommissionPdfAction,
  sendCommissionToLineAction,
} from "../commission-actions";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface DealFinancialsProps {
  deal: Deal;
  isRent: boolean;
  commissions: DealCommission[];
  invoices?: InvoiceRow[];
  agents: { id: string; display_name: string; role: string; avatar_url: string | null }[];
}

export function DealFinancials({
  deal,
  isRent,
  commissions: initialCommissions,
  invoices = [],
  agents = [],
}: DealFinancialsProps) {
  const [commissions, setCommissions] = useState(initialCommissions);
  const [calculating, setCalculating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editList, setEditList] = useState(initialCommissions);
  const [saving, setSaving] = useState(false);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

  const latestInvoice = invoices[0];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync state if initialCommissions prop updates
  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleEditChange = (index: number, field: "percentage" | "amount", value: number) => {
    const updated = [...editList];
    const item = { ...updated[index] };
    const base = deal.commission_total || 0;

    if (field === "percentage") {
      item.percentage = value;
      item.amount = Number(((base * value) / 100).toFixed(2));
    } else if (field === "amount") {
      item.amount = value;
      item.percentage = base > 0 ? Number(((value / base) * 100).toFixed(2)) : 0;
    }

    const currentAmount = item.amount ?? 0;
    const taxRate = item.tax_rate ?? 3;
    const whtRate = (item.recipient_role !== "AGENCY" && item.recipient_role !== "TEAM_POOL") ? (taxRate / 100) : 0;
    item.tax_amount = Number((currentAmount * whtRate).toFixed(2));
    item.net_amount = Number((currentAmount - (item.tax_amount ?? 0)).toFixed(2));

    updated[index] = item;
    setEditList(updated);
  };

  const handleAddRow = () => {
    const newItem: DealCommission = {
      id: "",
      deal_id: deal.id,
      tenant_id: deal.tenant_id,
      recipient_id: null,
      recipient_role: "LISTING",
      percentage: 0,
      amount: 0,
      tax_rate: 3,
      tax_amount: 0,
      net_amount: 0,
      status: "UNPAID",
      metadata: {},
      paid_at: null,
      created_at: new Date().toISOString(),
    };
    setEditList([...editList, newItem]);
  };

  const handleDeleteRow = (index: number) => {
    setEditList(editList.filter((_, idx) => idx !== index));
  };

  const handleRecipientSelectionChange = (index: number, selectionValue: string) => {
    const updated = [...editList];
    const item = { ...updated[index] };

    if (selectionValue === "AGENCY") {
      item.recipient_id = null;
      item.recipient_role = "AGENCY";
      item.tax_rate = 0;
      delete item.agent;
    } else if (selectionValue === "TEAM_POOL") {
      item.recipient_id = null;
      item.recipient_role = "TEAM_POOL";
      item.tax_rate = 0;
      delete item.agent;
    } else if (selectionValue === "CO_AGENT") {
      item.recipient_id = deal.partner_co_broker_id || null;
      item.recipient_role = "CO_AGENT";
      item.tax_rate = 3;
      delete item.agent;
    } else {
      const agent = agents.find(a => a.id === selectionValue);
      if (agent) {
        item.recipient_id = agent.id;
        item.recipient_role = "LISTING";
        item.tax_rate = 3;
        item.agent = {
          id: agent.id,
          display_name: agent.display_name,
          avatar_url: agent.avatar_url
        };
      }
    }

    const currentAmount = item.amount ?? 0;
    const taxRate = item.tax_rate ?? 3;
    const whtRate = (item.recipient_role !== "AGENCY" && item.recipient_role !== "TEAM_POOL") ? (taxRate / 100) : 0;
    item.tax_amount = Number((currentAmount * whtRate).toFixed(2));
    item.net_amount = Number((currentAmount - (item.tax_amount ?? 0)).toFixed(2));

    updated[index] = item;
    setEditList(updated);
  };

  const handleRoleChange = (index: number, role: string) => {
    const updated = [...editList];
    const item = { ...updated[index] };
    item.recipient_role = role;
    if (role === "CO_AGENT") {
      item.recipient_id = deal.partner_co_broker_id || null;
    } else if (role === "AGENCY" || role === "TEAM_POOL") {
      item.recipient_id = null;
    }
    
    item.tax_rate = (role === "AGENCY" || role === "TEAM_POOL") ? 0 : 3;
    const currentAmount = item.amount ?? 0;
    const whtRate = (item.tax_rate ?? 3) / 100;
    item.tax_amount = Number((currentAmount * whtRate).toFixed(2));
    item.net_amount = Number((currentAmount - (item.tax_amount ?? 0)).toFixed(2));

    updated[index] = item;
    setEditList(updated);
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      const res = await updateDealCommissionsAction(deal.id, editList.map(c => ({
        id: c.id ? c.id : undefined,
        recipient_id: c.recipient_id,
        recipient_role: c.recipient_role,
        percentage: c.percentage ?? 0,
        amount: c.amount ?? 0,
        tax_rate: c.tax_rate ?? 0,
        tax_amount: c.tax_amount ?? 0,
        net_amount: c.net_amount ?? 0
      })));

      if (res.success) {
        toast.success("บันทึกการจัดสรรคอมมิชชั่นเรียบร้อยแล้ว ✨");
        setCommissions(editList);
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
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
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditList(commissions);
                    setIsEditing(false);
                  }}
                  disabled={saving}
                  className="h-9 px-3 rounded-lg text-slate-600 border-slate-200"
                >
                  ยกเลิก
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditList(commissions);
                    setIsEditing(true);
                  }}
                  className="h-9 px-3 rounded-lg text-slate-700 border-slate-200"
                >
                  แก้ไข
                </Button>
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
            )}
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {commissions.length > 0 || isEditing ? (
            <>
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
                {(isEditing ? editList : commissions).map((comm, idx) => (
                  <TableRow
                    key={comm.id || `new-${idx}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-2 max-w-[280px]">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="w-full sm:w-44 h-8 justify-start text-xs font-semibold px-2 py-1 text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-xs"
                            onClick={() => setActiveEditIndex(idx)}
                          >
                            {comm.recipient_id ? (
                              <div className="flex items-center gap-1.5 truncate">
                                <Avatar className="h-4.5 w-4.5 border border-slate-200">
                                  <AvatarImage src={comm.agent?.avatar_url || ""} />
                                  <AvatarFallback className="text-[7px]">
                                    {comm.agent?.display_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{comm.agent?.display_name}</span>
                              </div>
                            ) : (
                              <span>
                                {comm.recipient_role === "CO_AGENT" && deal.co_agent_name
                                  ? deal.co_agent_name
                                  : getRoleLabel(comm.recipient_role)}
                              </span>
                            )}
                          </Button>

                          {comm.recipient_id && (
                            <select
                              value={comm.recipient_role}
                              onChange={(e) => handleRoleChange(idx, e.target.value)}
                              className="w-full sm:w-28 h-8 text-[11px] rounded-md border border-slate-200 px-2 py-1 bg-white font-medium text-slate-600 shadow-xs"
                            >
                              <option value="LISTING">Listing Agent</option>
                              <option value="CLOSING">Closing Agent</option>
                              <option value="CO_AGENT">Co-Agent</option>
                            </select>
                          )}
                        </div>
                      ) : (
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
                                  {comm.recipient_role === "CO_AGENT" && deal.co_agent_name
                                    ? deal.co_agent_name
                                    : getRoleLabel(comm.recipient_role)}
                                </span>
                                {comm.recipient_role === "AGENCY" && (
                                  <span className="text-[10px] text-slate-400">
                                    หักเข้ากองกลางบริษัท
                                  </span>
                                )}
                                {comm.recipient_role === "CO_AGENT" && (
                                  <span className="text-[10px] text-slate-400">
                                    นายหน้าร่วมภายนอก (Co-Agent)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={comm.percentage ?? 0}
                          onChange={(e) => handleEditChange(idx, "percentage", Number(e.target.value))}
                          className="w-20 h-8 text-center text-xs p-1"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-600">
                          {comm.percentage}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={comm.amount ?? 0}
                          onChange={(e) => handleEditChange(idx, "amount", Number(e.target.value))}
                          className="w-28 h-8 text-right text-xs p-1 ml-auto font-semibold"
                        />
                      ) : (
                        `฿${(comm.amount || 0).toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-500 font-medium">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="checkbox"
                            checked={(comm.tax_rate ?? 0) > 0}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updated = [...editList];
                              const item = { ...updated[idx] };
                              item.tax_rate = checked ? 3 : 0;
                              
                              // Recalculate WHT/Net
                              const currentAmount = item.amount ?? 0;
                              const whtRate = (item.tax_rate ?? 3) / 100;
                              item.tax_amount = Number((currentAmount * whtRate).toFixed(2));
                              item.net_amount = Number((currentAmount - (item.tax_amount ?? 0)).toFixed(2));

                              updated[idx] = item;
                              setEditList(updated);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-500 font-semibold select-none">
                            {(comm.tax_amount || 0) > 0 ? `-฿${(comm.tax_amount || 0).toLocaleString()}` : "-"}
                          </span>
                        </div>
                      ) : (
                        (comm.tax_amount || 0) > 0
                          ? `-฿${(comm.tax_amount || 0).toLocaleString()}`
                          : "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-base font-bold text-emerald-600">
                        ฿{(comm.net_amount || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {isEditing ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto flex items-center justify-center"
                          onClick={() => handleDeleteRow(idx)}
                          title="ลบผู้รับส่วนแบ่ง"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
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
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isEditing && (
              <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddRow}
                  className="gap-2 text-xs font-semibold text-blue-600 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มผู้รับส่วนแบ่ง
                </Button>
              </div>
            )}
            </>
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

      {/* Recipient Selection Dialog */}
      <ResponsiveDialog
        open={activeEditIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveEditIndex(null);
        }}
        title="เลือกผู้รับส่วนแบ่ง"
        description="เลือกช่องทางกองกลางหรือรายชื่อเอเจ้นท์ภายในบริษัทที่ต้องการมอบส่วนแบ่งคอมมิชชั่นให้"
      >
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Special roles / pools */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ระบบกองกลาง & นายหน้าภายนอก</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                type="button"
                className="h-12 justify-start gap-2.5 px-3 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all text-xs font-bold text-slate-700"
                onClick={() => {
                  if (activeEditIndex !== null) {
                    handleRecipientSelectionChange(activeEditIndex, "AGENCY");
                    setActiveEditIndex(null);
                  }
                }}
              >
                <Building2 className="h-4 w-4 text-indigo-500" />
                <span>Agency (กองกลาง)</span>
              </Button>
              <Button
                variant="outline"
                type="button"
                className="h-12 justify-start gap-2.5 px-3 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all text-xs font-bold text-slate-700"
                onClick={() => {
                  if (activeEditIndex !== null) {
                    handleRecipientSelectionChange(activeEditIndex, "TEAM_POOL");
                    setActiveEditIndex(null);
                  }
                }}
              >
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span>Team Pool (ทีม)</span>
              </Button>
              <Button
                variant="outline"
                type="button"
                className="h-12 justify-start gap-2.5 px-3 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold text-slate-700"
                onClick={() => {
                  if (activeEditIndex !== null) {
                    handleRecipientSelectionChange(activeEditIndex, "CO_AGENT");
                    setActiveEditIndex(null);
                  }
                }}
              >
                <Users className="h-4 w-4 text-slate-500" />
                <span>Co-Agent (ภายนอก)</span>
              </Button>
            </div>
          </div>

          {/* Active Agents list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">เอเจ้นท์ภายในบริษัท</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  variant="outline"
                  type="button"
                  className="h-14 justify-start gap-3 px-3 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-left"
                  onClick={() => {
                    if (activeEditIndex !== null) {
                      handleRecipientSelectionChange(activeEditIndex, agent.id);
                      setActiveEditIndex(null);
                    }
                  }}
                >
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarImage src={agent.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-slate-100 text-slate-500 font-bold">
                      {agent.display_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-700 truncate">{agent.display_name}</span>
                    <span className="text-[10px] text-slate-400 truncate uppercase">{agent.role}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
