"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addMonths, subDays } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getContractByDealId as _noop } from "@/features/rental-contracts/actions"; // noop to keep import types consistent

type Props = {
  dealId: string;
  dealType: string;
  defaultRent?: number | null;
  defaultLeaseTerm?: number | null;
  dealStatus?: string;
};
import {
  contractFormSchema,
  ContractFormInput,
} from "@/features/rental-contracts/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Ban,
  XCircle,
  Calendar as CalendarIcon,
  Wallet,
  PenLine,
  ChevronRight,
  Trash2,
  FileText,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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
}: Props) {
  const canCreateContract =
    dealStatus === "CLOSED_WIN" || dealStatus === "SIGNED";
  const [contract, setContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const fetchContract = async () => {
    setLoading(true);
    const res = await fetch(`/api/rental-contracts/${dealId}`);
    if (res.ok) {
      const data = await res.json();
      setContract(data ?? null);
    } else {
      setContract(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!["RENT", "SALE"].includes(dealType)) return;
    fetchContract();
  }, [dealId, dealType]);

  const form = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema) as any,
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

  // Watches for auto-calculation
  const startDate = form.watch("start_date");
  const leaseTerm = form.watch("lease_term_months");

  // Auto-calc End Date
  useEffect(() => {
    if (startDate && leaseTerm) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime()) && leaseTerm > 0) {
        // Calculate end date: Start Date + Lease Term - 1 Day
        const end = subDays(addMonths(start, leaseTerm), 1);
        // Update end_date if it's different to avoid loops (though setValue check might handle it)
        const currentEnd = form.getValues("end_date");
        const newEndString = end.toISOString().split("T")[0];

        if (currentEnd !== newEndString) {
          form.setValue("end_date", newEndString, { shouldDirty: false });
        }
      }
    }
  }, [startDate, leaseTerm, form]);

  useEffect(() => {
    // reset when contract changes
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
  }, [contract?.id]); // ONLY reset when contract ID changes, ignore dealId/defaultRent/defaultLeaseTerm changes

  const handleSubmit = async (vals: ContractFormInput) => {
    try {
      const payload = { ...vals, deal_id: dealId } as any;
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
              ⚠️ ต้องปิดดีลให้ "สำเร็จ" ก่อนจึงจะสร้างสัญญาได้
            </div>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant={contract ? "outline" : "default"}
                    className={cn(
                      "flex-1 sm:flex-initial gap-1.5 transition-all active:scale-95 shadow-xs h-9 sm:h-8",
                      !contract &&
                        "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900",
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
                </DialogTrigger>
                {contract && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      !["DRAFT", "TERMINATED"].includes(contract.status)
                    }
                    className={`flex-1 sm:flex-initial gap-1.5 transition-all active:scale-95 h-9 sm:h-8 ${
                      ["DRAFT", "TERMINATED"].includes(contract.status)
                        ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    ลบสัญญา
                  </Button>
                )}
              </div>
              <DialogContent className="sm:max-w-lg w-[calc(100vw-1.5rem)] max-h-[90vh] p-0 flex flex-col rounded-2xl">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b  border-slate-200  shrink-0">
                  <DialogTitle className="text-lg sm:text-xl">
                    {contract ? "แก้ไขสัญญา" : "สร้างสัญญาใหม่"}
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
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
                        {dealType === "RENT" && (
                          /* Only show Deposit/Advance calculator for RENT */
                          <PriceInput
                            value={form.watch("rent_price")}
                            onChange={(val) =>
                              form.setValue("rent_price", val, {
                                shouldDirty: true,
                              })
                            }
                          />
                        )}
                        {dealType !== "RENT" && (
                          <PriceInput
                            value={form.watch("rent_price")}
                            onChange={(val) =>
                              form.setValue("rent_price", val, {
                                shouldDirty: true,
                              })
                            }
                          />
                        )}
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
                                        { shouldDirty: true },
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
                          onValueChange={(val: any) =>
                            form.setValue("status", val, { shouldDirty: true })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
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
                          {...form.register("other_terms")}
                        />
                        {dealType === "SALE" && (
                          <div className="flex gap-2 mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => {
                                const current =
                                  form.getValues("other_terms") || "";
                                const toAdd = "ค่าโอนคนละครึ่ง (50/50)";
                                if (!current.includes(toAdd)) {
                                  form.setValue(
                                    "other_terms",
                                    current ? `${current}, ${toAdd}` : toAdd,
                                  );
                                }
                              }}
                            >
                              + ค่าโอน 50/50
                            </Button>
                          </div>
                        )}
                      </div>

                      {dealType === "RENT" && (
                        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-600">
                              เงินประกัน
                            </span>
                            <span className="text-sm font-medium">
                              {(
                                form.watch("deposit_amount") || 0
                              ).toLocaleString()}{" "}
                              บาท
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                            <span className="text-sm font-semibold text-slate-600">
                              เงินล่วงหน้า
                            </span>
                            <span className="text-sm font-medium">
                              {(
                                form.watch("advance_payment_amount") || 0
                              ).toLocaleString()}{" "}
                              บาท
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-slate-800">
                              รวมยอดชำระแรกเข้า
                            </span>
                            <span className="text-lg font-bold text-blue-600">
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

                  <div className="p-4 border-t border-slate-200  bg-white flex justify-end gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      type="button"
                      className="flex-1 sm:flex-initial h-10"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 sm:flex-initial h-10 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      บันทึก
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
        ) : contract ? (
          <div className="bg-muted/20 p-4 sm:p-3 rounded-xl sm:rounded border border-slate-100 sm:border-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  หมายเลขสัญญา: {contract.contract_number ?? "-"}
                </div>
                <div className="text-sm font-semibold sm:font-normal">
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
                {/* 1. Sign (Primary Action for Draft) */}
                {contract.status === "DRAFT" && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/rental-contracts/${dealId}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: contract.id,
                              status: "ACTIVE",
                            }),
                          },
                        );
                        const payload = await res.json();
                        if (!res.ok)
                          throw new Error(payload.message || "Sign failed");
                        toast.success("สัญญาถูกเซ็นเรียบร้อย");
                        await fetchContract();
                      } catch (e) {
                        console.error(e);
                        toast.error("ไม่สามารถเซ็นสัญญาได้");
                      }
                    }}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    เริ่มสัญญา
                  </Button>
                )}

                {/* 2. View */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-initial gap-1.5 h-9 sm:h-8"
                    >
                      <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      ดูสัญญา
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>รายละเอียดสัญญา</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                        <div className="col-span-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                            หมายเลขสัญญา
                          </p>
                          <p className="font-bold text-blue-600">
                            {contract.contract_number ?? "-"}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                            สถานะ
                          </p>
                          <div className="scale-90 origin-left">
                            <ContractStatusBadge status={contract.status} />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                            วันเริ่มสัญญา
                          </p>
                          <p className="font-semibold">
                            {contract.start_date ?? "-"}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                            วันสิ้นสุดสัญญา
                          </p>
                          <p className="font-semibold">
                            {contract.end_date ?? "-"}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                            ราคาเช่า/งวด
                          </p>
                          <p className="font-bold text-slate-900">
                            {Number(contract.rent_price).toLocaleString()} บาท
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                            ระยะเวลาสัญญา
                          </p>
                          <p className="font-semibold">
                            {contract.lease_term_months} เดือน
                          </p>
                        </div>
                        {(contract.deposit_amount ?? 0) > 0 && (
                          <div className="col-span-1">
                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                              เงินประกัน
                            </p>
                            <p className="font-semibold">
                              {Number(contract.deposit_amount).toLocaleString()}{" "}
                              บาท
                            </p>
                          </div>
                        )}
                        {(contract.advance_payment_amount ?? 0) > 0 && (
                          <div className="col-span-1">
                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                              เงินล่วงหน้า
                            </p>
                            <p className="font-semibold">
                              {Number(
                                contract.advance_payment_amount,
                              ).toLocaleString()}{" "}
                              บาท
                            </p>
                          </div>
                        )}
                      </div>
                      {contract.other_terms && (
                        <div className="text-sm border-t pt-3">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                            เงื่อนไขอื่นๆ
                          </p>
                          <p className="p-3 bg-muted/50 rounded-lg text-slate-700 leading-relaxed text-xs sm:text-sm">
                            {contract.other_terms}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* 4. Terminate (Stop) */}
                {contract.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/20 gap-1.5 transition-all active:scale-95 flex items-center shadow-xs h-9 sm:h-8"
                    onClick={() => setShowStopDialog(true)}
                  >
                    <Ban className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    หยุดสัญญา
                  </Button>
                )}

                {/* Confirm Stop Dialog */}
                <AlertDialog
                  open={showStopDialog}
                  onOpenChange={setShowStopDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ยืนยันการหยุดสัญญา</AlertDialogTitle>
                      <AlertDialogDescription>
                        คุณต้องการหยุดสัญญา/ยกเลิกสัญญานี้ใช่หรือไม่?
                        สถานะจะเปลี่ยนเป็น TERMINATED และไม่สามารถย้อนกลับเป็น
                        ACTIVE ได้ง่ายๆ
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isActionPending}>
                        ยกเลิก
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isActionPending}
                        className="bg-amber-600 hover:bg-amber-700 font-medium"
                        onClick={async (e) => {
                          e.preventDefault();
                          setIsActionPending(true);
                          try {
                            const res = await fetch(
                              `/api/rental-contracts/${dealId}`,
                              {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: contract.id,
                                  status: "TERMINATED",
                                }),
                              },
                            );
                            if (!res.ok) throw new Error("Terminate failed");
                            toast.success("หยุดสัญญาเรียบร้อย");
                            await fetchContract();
                            setShowStopDialog(false);
                          } catch (e) {
                            toast.error("ล้มเหลวในการหยุดสัญญา");
                          } finally {
                            setIsActionPending(false);
                          }
                        }}
                      >
                        ยืนยันการหยุดสัญญา
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Confirm Delete Dialog */}
                <AlertDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ยืนยันการลบสัญญา</AlertDialogTitle>
                      <AlertDialogDescription>
                        คุณแน่ใจหรือไม่ว่าต้องการลบสัญญานี้?
                        ข้อมูลสัญญาและเอกสารที่เกี่ยวข้องจะถูกลบออกจากระบบเป็นการถาวร
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isActionPending}>
                        ยกเลิก
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isActionPending}
                        className="bg-red-600 hover:bg-red-700 font-medium"
                        onClick={async (e) => {
                          e.preventDefault();
                          setIsActionPending(true);
                          try {
                            const res = await fetch(
                              `/api/rental-contracts/${dealId}`,
                              {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: contract.id }),
                              },
                            );
                            if (!res.ok) throw new Error("Delete failed");
                            toast.success("ลบสัญญาเรียบร้อย");
                            await fetchContract();
                            setShowDeleteDialog(false);
                          } catch (e) {
                            toast.error("ล้มเหลวในการลบสัญญา");
                          } finally {
                            setIsActionPending(false);
                          }
                        }}
                      >
                        ยืนยันการลบ
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-2">
              <DocumentSection
                ownerId={contract.id}
                ownerType={"RENTAL_CONTRACT" as any}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">ยังไม่มีสัญญา</div>
        )}
      </div>
    </div>
  );
}
