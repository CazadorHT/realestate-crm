"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addMonths, subDays } from "date-fns";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getContractByDealId as _noop } from "@/features/rental-contracts/actions"; // noop to keep import types consistent
import { Resolver } from "react-hook-form";
import { DocumentOwnerType } from "@/features/documents/schema";

type Props = {
  dealId: string;
  dealType: string;
  defaultRent?: number | null;
  defaultLeaseTerm?: number | null;
  dealStatus?: string;
  tenantId?: string | null;
};
import {
  contractFormSchema,
  ContractFormInput,
  RentalContract,
} from "@/features/rental-contracts/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Ban,
  AlertCircle,
  Calendar as CalendarIcon,
  Wallet,
  PenLine,
  Trash2,
  Plus,
} from "lucide-react";
import { RiEdit2Line } from "react-icons/ri";
import { DatePicker } from "@/components/ui/date-picker";
import { PriceInput } from "@/components/ui/price-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatThaiCurrency } from "@/lib/excel-export";

function ContractStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    ACTIVE: "bg-emerald-100 text-emerald-600 border-emerald-200",
    TERMINATED: "bg-red-100 text-red-600 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={`${styles[status] || ""} font-medium border`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "ใช้งาน (Active)";
    case "TERMINATED":
      return "สิ้นสุด/ยกเลิก (Terminated)";
    case "DRAFT":
      return "ร่างสัญญา (Draft)";
    default:
      return status;
  }
}

export function RentalContractSection({
  dealId,
  dealType,
  defaultRent,
  defaultLeaseTerm,
  dealStatus,
  tenantId,
}: Props) {
  const canCreateContract =
    dealStatus === "CLOSED_WIN" || dealStatus === "SIGNED";
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetails, setShowDetails] = useState<RentalContract | null>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState<RentalContract | null>(
    null,
  );

  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const fetchContract = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/rental-contracts/${dealId}`);
    if (res.ok) {
      const data = await res.json();
      setContract(data ?? null);
    } else {
      setContract(null);
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    if (!["RENT", "SALE"].includes(dealType)) return;
    fetchContract();
  }, [dealId, dealType, fetchContract]);

  const form = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema) as unknown as Resolver<ContractFormInput>,
    mode: "onChange",
    defaultValues: {
      deal_id: dealId,
      start_date: today,
      end_date: undefined,
      rent_price: undefined,
      deposit_amount: undefined,
      lease_term_months: undefined,
      payment_cycle: undefined,
      other_terms: undefined,
      advance_payment_amount: undefined,
      status: "DRAFT",
    },
  });

  const rentPrice = form.watch("rent_price") || 0;

  const startDate = form.watch("start_date");
  const leaseTerm = form.watch("lease_term_months");

  useEffect(() => {
    if (startDate && leaseTerm) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime()) && leaseTerm > 0) {
        const end = subDays(addMonths(start, leaseTerm), 1);
        const currentEnd = form.getValues("end_date");
        const newEndString = end.toISOString().split("T")[0];

        if (currentEnd !== newEndString) {
          form.setValue("end_date", newEndString, { shouldDirty: false });
        }
      }
    }
  }, [startDate, leaseTerm, form]);

  useEffect(() => {
    const initialRent = contract?.rent_price ?? defaultRent ?? 0;

    form.reset({
      deal_id: dealId,
      start_date: contract?.start_date ?? today,
      end_date: contract?.end_date ?? undefined,
      rent_price: contract?.rent_price ?? defaultRent ?? undefined,
      deposit_amount:
        contract?.deposit_amount ?? (initialRent ? initialRent * 2 : undefined),
      lease_term_months:
        contract?.lease_term_months ?? defaultLeaseTerm ?? undefined,
      payment_cycle: contract?.payment_cycle ?? undefined,
      other_terms: contract?.other_terms ?? undefined,
      advance_payment_amount:
        contract?.advance_payment_amount ??
        (initialRent ? initialRent * 1 : undefined),
      status: contract?.status ?? "DRAFT",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]); // intentionally omit form/dealId/today/defaultRent/defaultLeaseTerm — these are initialization-time values only

  const handleSubmit = async (vals: ContractFormInput) => {
    try {
      const payload: Record<string, unknown> = { ...vals, deal_id: dealId };
      if (contract?.id) payload.id = contract.id;

      const method = contract?.id ? "PUT" : "POST";
      const res = await fetch(`/api/rental-contracts/${dealId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Save failed");
        return;
      }

      toast.success("บันทึกสัญญาเรียบร้อย");
      setOpen(false);
      await fetchContract();
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/rental-contracts/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      toast.success(
        newStatus === "ACTIVE" ? "เริ่มสัญญาเรียบร้อย" : "หยุดสัญญาเรียบร้อย",
      );
      await fetchContract();
    } catch (e) {
      console.error(e);
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rental-contracts/${dealId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success("ลบสัญญาเรียบร้อย");
      await fetchContract();
    } catch (e) {
      console.error(e);
      toast.error("ไม่สามารถลบสัญญาได้");
    }
  };

  if (!["RENT", "SALE"].includes(dealType)) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {dealType === "RENT"
            ? "สัญญาเช่า"
            : dealType === "SALE"
              ? "สัญญาซื้อขาย"
              : "สัญญา"}
        </h3>
        <div>
          {!contract && !canCreateContract ? (
            <div className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ ต้องปิดดีลให้ &quot;สำเร็จ&quot; ก่อนจึงจะสร้างสัญญาได้
            </div>
          ) : (
            <ResponsiveDialog
              open={open}
              onOpenChange={(val: boolean) => setOpen(val)}
              title={contract ? "แก้ไขสัญญา" : "สร้างสัญญาใหม่"}
              description={
                contract
                  ? "ปรับปรุงรายละเอียดสัญญาและเงื่อนไข"
                  : "ระบุเงื่อนไขและวันที่เริ่มต้นสัญญาให้ครบถ้วน"
              }
              trigger={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={contract ? "outline" : "default"}
                    className={cn(
                      "flex-1 sm:flex-initial gap-1.5 transition-all active:scale-95 shadow-xs h-9 sm:h-8 font-semibold",
                      !contract && "bg-slate-900 hover:bg-slate-800 text-white",
                    )}
                  >
                    {contract ? (
                      <>
                        <RiEdit2Line className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        แก้ไขสัญญา
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        สร้างสัญญา
                      </>
                    )}
                  </Button>
                  {contract && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={
                        !["DRAFT", "TERMINATED"].includes(contract.status)
                      }
                      className={`flex-1 sm:flex-initial gap-1.5 transition-all active:scale-95 h-9 sm:h-8 font-semibold ${
                        ["DRAFT", "TERMINATED"].includes(contract.status)
                          ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                          : "text-muted-foreground opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      ลบสัญญา
                    </Button>
                  )}
                </div>
              }
              footer={
                <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2 w-full shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    type="button"
                    className="flex-1 rounded-xl h-11 font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={form.handleSubmit(handleSubmit)}
                    className="flex-1 rounded-xl h-11 px-8 font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-95 transition-all"
                  >
                    บันทึกสัญญา
                  </Button>
                </div>
              }
            >
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col flex-1 min-h-0 overflow-hidden text-left"
              >
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[60vh] sm:max-h-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        {dealType === "RENT"
                          ? "วันที่เริ่มสัญญา"
                          : "วันที่จดสัญญา"}
                      </Label>
                      <DatePicker
                        value={form.watch("start_date")}
                        onChange={(date) =>
                          form.setValue("start_date", date, {
                            shouldDirty: true,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CalendarIcon className="h-4 w-4 text-slate-500" />
                        {dealType === "RENT"
                          ? "วันที่สิ้นสุด"
                          : "วันโอนกรรมสิทธิ์"}
                      </Label>
                      <DatePicker
                        value={form.watch("end_date")}
                        onChange={(date) =>
                          form.setValue("end_date", date, {
                            shouldDirty: true,
                          })
                        }
                        placeholder="เลือกวันที่"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Wallet className="h-4 w-4 text-emerald-500" />
                        {dealType === "RENT" ? "ราคาค่าเช่า" : "ราคาซื้อขาย"}
                      </Label>
                      <PriceInput
                        value={form.watch("rent_price") ?? 0}
                        onChange={(val) =>
                          form.setValue("rent_price", val, {
                            shouldDirty: true,
                          })
                        }
                      />
                    </div>

                    {dealType === "RENT" && (
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                          <span>เงินประกัน</span>
                          {rentPrice > 0 && (
                            <div className="flex gap-1">
                              {[1, 2, 3].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() =>
                                    form.setValue(
                                      "deposit_amount",
                                      m * rentPrice,
                                      {
                                        shouldDirty: true,
                                      },
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                    form.watch("deposit_amount") ===
                                    m * rentPrice
                                      ? "bg-blue-600 text-white shadow-sm scale-110"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  }`}
                                >
                                  {m} ด.
                                </button>
                              ))}
                            </div>
                          )}
                        </Label>
                        <PriceInput
                          value={form.watch("deposit_amount") ?? 0}
                          onChange={(val) =>
                            form.setValue("deposit_amount", val, {
                              shouldDirty: true,
                            })
                          }
                        />
                      </div>
                    )}

                    {dealType === "RENT" && (
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                          <span>เงินล่วงหน้า</span>
                          {rentPrice > 0 && (
                            <div className="flex gap-1">
                              {[1, 2, 3].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() =>
                                    form.setValue(
                                      "advance_payment_amount",
                                      m * rentPrice,
                                      { shouldDirty: true },
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                    form.watch("advance_payment_amount") ===
                                    m * rentPrice
                                      ? "bg-blue-600 text-white shadow-sm scale-110"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  }`}
                                >
                                  {m} ด.
                                </button>
                              ))}
                            </div>
                          )}
                        </Label>
                        <PriceInput
                          value={form.watch("advance_payment_amount") ?? 0}
                          onChange={(val) =>
                            form.setValue("advance_payment_amount", val, {
                              shouldDirty: true,
                            })
                          }
                        />
                      </div>
                    )}

                    {dealType === "RENT" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          ระยะเวลาสัญญา (เดือน)
                        </Label>
                        <Input
                          type="number"
                          disabled
                          className="rounded-xl bg-slate-50 border-slate-200 h-11"
                          {...form.register("lease_term_months", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">
                        สถานะสัญญา
                      </Label>
                      <Select
                        value={form.watch("status")}
                        onValueChange={(val: "DRAFT" | "ACTIVE" | "TERMINATED") =>
                          form.setValue("status", val, { shouldDirty: true })
                        }
                      >
                        <SelectTrigger className="rounded-xl h-11 border-slate-200">
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="DRAFT">
                            <ContractStatusBadge status="DRAFT" />
                          </SelectItem>
                          <SelectItem value="ACTIVE">
                            <ContractStatusBadge status="ACTIVE" />
                          </SelectItem>
                          <SelectItem value="TERMINATED">
                            <ContractStatusBadge status="TERMINATED" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">
                        เงื่อนไขอื่นๆ
                      </Label>
                      <Input
                        placeholder="เช่น อนุญาตให้เลี้ยงสัตว์ได้, จอดรถฟรี 1 คัน"
                        className="rounded-xl h-11 border-slate-200"
                        {...form.register("other_terms")}
                      />
                    </div>

                    {dealType === "RENT" && (
                      <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-500">
                            เงินประกัน
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {(
                              form.watch("deposit_amount") || 0
                            ).toLocaleString()}{" "}
                            บาท
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                          <span className="text-sm font-semibold text-slate-500">
                            เงินล่วงหน้า
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {(
                              form.watch("advance_payment_amount") || 0
                            ).toLocaleString()}{" "}
                            บาท
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-slate-800">
                            รวมยอดชำระแรกเข้า
                          </span>
                          <span className="text-lg font-semibold text-blue-600">
                            {(
                              (form.watch("deposit_amount") || 0) +
                              (form.watch("advance_payment_amount") || 0)
                            ).toLocaleString()}{" "}
                            บาท
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </ResponsiveDialog>
          )}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
        ) : contract ? (
          <div className="bg-muted/20 p-4 rounded-xl border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  หมายเลขสัญญา: {contract.contract_number ?? "-"}
                </div>
                <div className="text-sm font-semibold">
                  {contract.start_date
                    ? `${contract.start_date} — ${contract.end_date ?? ""}`
                    : "ยังไม่ได้กำหนดวันที่"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <span>สถานะ:</span>
                  <ContractStatusBadge status={contract.status ?? "DRAFT"} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {contract.status === "DRAFT" && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 font-semibold h-9 sm:h-8"
                    onClick={() => handleStatusChange(contract.id, "ACTIVE")}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    เริ่มสัญญา
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-initial gap-1.5 h-9 sm:h-8 font-semibold"
                  onClick={() => setShowDetails(contract)}
                >
                  <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  ดูสัญญา
                </Button>

                {contract.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 gap-1.5 transition-all active:scale-95 font-semibold h-9 sm:h-8"
                    onClick={() => setShowTerminateDialog(contract)}
                  >
                    <Ban className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    หยุดสัญญา
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <DocumentSection
                ownerId={contract.id}
                ownerType={"RENTAL_CONTRACT" as DocumentOwnerType}
                tenantId={tenantId}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">ยังไม่มีสัญญา</div>
        )}
      </div>

      <ResponsiveDialog
        open={!!showDetails}
        onOpenChange={(val: boolean) => !val && setShowDetails(null)}
        title="รายละเอียดสัญญา"
        description="ข้อมูลสรุปและระยะเวลาของสัญญาปัจจุบัน"
      >
        <div className="p-4 sm:p-6 space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                สถานะ
              </p>
              <ContractStatusBadge status={showDetails?.status || ""} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ประเภทดีล
              </p>
              <p className="font-semibold text-slate-700">
                {dealType === "RENT" ? "เช่าอสังหาริมทรัพย์" : "ซื้อ-ขาย"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {dealType === "RENT" ? "วันที่เริ่มสัญญา" : "วันที่จดสัญญา"}
              </p>
              <p className="font-semibold text-slate-700">
                {showDetails?.start_date
                  ? new Date(showDetails.start_date).toLocaleDateString("th-TH")
                  : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {dealType === "RENT" ? "วันที่สิ้นสุด" : "วันโอนกรรมสิทธิ์"}
              </p>
              <p className="font-semibold text-slate-700">
                {showDetails?.end_date
                  ? new Date(showDetails.end_date).toLocaleDateString("th-TH")
                  : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {dealType === "RENT" ? "ราคาค่าเช่า" : "ราคาซื้อขาย"}
              </p>
              <p className="font-semibold text-blue-600 text-lg">
                {formatThaiCurrency(showDetails?.rent_price || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                เงื่อนไขอื่นๆ
              </p>
              <p className="text-slate-600 font-medium">
                {showDetails?.other_terms || "ไม่มีระบุ"}
              </p>
            </div>
          </div>

          {showDetails?.status === "ACTIVE" && (
            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTerminateDialog(showDetails);
                  setShowDetails(null);
                }}
                className="w-full justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold h-11 rounded-xl"
              >
                <AlertCircle className="h-4 w-4" />
                ยุติสัญญาก่อนกำหนด (Terminate)
              </Button>
            </div>
          )}
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={!!showTerminateDialog}
        onOpenChange={(val: boolean) => !val && setShowTerminateDialog(null)}
        title="ยืนยันการยุติสัญญา?"
        description="เมื่อยุติสัญญา สถานะจะเปลี่ยนเป็น TERMINATED และไม่สามารถแก้ไขได้อีก"
        footer={
          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setShowTerminateDialog(null)}
              className="flex-1 rounded-xl h-11 font-semibold text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                if (showTerminateDialog) {
                  handleStatusChange(showTerminateDialog.id, "TERMINATED");
                  setShowTerminateDialog(null);
                }
              }}
              className="flex-1 rounded-xl h-11 px-8 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-100 transition-all active:scale-95"
            >
              ยืนยันการยุติสัญญา
            </Button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            คุณต้องการยุติสัญญาเลขที่{" "}
            <span className="font-semibold text-slate-900">
              #{showTerminateDialog?.id.slice(0, 8)}
            </span>{" "}
            ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={showDeleteDialog}
        onOpenChange={(val: boolean) => setShowDeleteDialog(val)}
        title="ลบสัญญาถาวร?"
        description="ข้อมูลสัญญาและไฟล์แนบที่เกี่ยวข้องทั้งหมดจะถูกลบออกจากระบบ"
        footer={
          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 rounded-xl h-11 font-semibold text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={async () => {
                if (contract) {
                  await handleDelete(contract.id);
                  setShowDeleteDialog(false);
                }
              }}
              className="flex-1 rounded-xl h-11 px-8 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-100 transition-all active:scale-95"
            >
              ยืนยันการลบ
            </Button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            คุณกำลังจะลบสัญญาฉบับนี้อย่างถาวร
            ข้อมูลนี้จะไม่สามารถกู้คืนได้อีกในอนาคต
          </p>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
