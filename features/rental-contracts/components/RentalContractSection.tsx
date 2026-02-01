"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addMonths, subDays } from "date-fns";

// ... (keep other imports) ...

// ... (keep ContractStatusBadge and getStatusLabel) ...

type Props = {
  dealId: string;
  dealType: string;
  defaultRent?: number | null;
  defaultLeaseTerm?: number | null;
  dealStatus?: string;
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getContractByDealId as _noop } from "@/features/rental-contracts/actions"; // noop to keep import types consistent
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "lucide-react";
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
    defaultValues: {
      deal_id: dealId,
      start_date: contract?.start_date ?? today,
      end_date: contract?.end_date ?? undefined,
      rent_price: contract?.rent_price ?? defaultRent ?? undefined,
      deposit_amount: contract?.deposit_amount ?? undefined,
      lease_term_months:
        contract?.lease_term_months ?? defaultLeaseTerm ?? undefined,
      payment_cycle: contract?.payment_cycle ?? undefined,
      other_terms: contract?.other_terms ?? undefined,
      advance_payment_amount: contract?.advance_payment_amount ?? undefined,
      status: contract?.status ?? "DRAFT",
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
          form.setValue("end_date", newEndString);
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
  }, [contract, dealId]); // Removed defaultRent, defaultLeaseTerm to prevent reset on parent re-render

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
              <DialogTrigger asChild>
                <Button size="sm">
                  {contract ? "แก้ไขสัญญา" : "สร้างสัญญา"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {contract ? "แก้ไขสัญญา" : "สร้างสัญญาใหม่"}
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-3 max-w-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        {dealType === "RENT"
                          ? "วันที่เริ่มสัญญา"
                          : "วันที่จดสัญญา"}
                      </Label>
                      <DatePicker
                        value={form.watch("start_date")}
                        onChange={(date) => form.setValue("start_date", date)}
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
                        onChange={(date) => form.setValue("end_date", date)}
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
                          onChange={(val) => form.setValue("rent_price", val)}
                        />
                      )}
                      {dealType !== "RENT" && (
                        <PriceInput
                          value={form.watch("rent_price")}
                          onChange={(val) => form.setValue("rent_price", val)}
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
                            form.setValue("deposit_amount", val)
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
                            form.setValue("advance_payment_amount", val)
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
                          form.setValue("status", val)
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

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      type="button"
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit">บันทึก</Button>
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
          <div className="bg-muted/20 p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  หมายเลขสัญญา: {contract.contract_number ?? "-"}
                </div>
                <div className="text-sm">
                  {contract.start_date
                    ? `${contract.start_date} — ${contract.end_date ?? ""}`
                    : "ยังไม่ได้กำหนดวันที่"}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  สถานะ:{" "}
                  <ContractStatusBadge status={contract.status ?? "DRAFT"} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* View Details Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      ดูสัญญา
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>รายละเอียดสัญญา</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">หมายเลขสัญญา</p>
                          <p className="font-medium text-blue-600">
                            {contract.contract_number ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">สถานะ</p>
                          <div>
                            <ContractStatusBadge status={contract.status} />
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">วันเริ่มสัญญา</p>
                          <p className="font-medium">
                            {contract.start_date ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            วันสิ้นสุดสัญญา
                          </p>
                          <p className="font-medium">
                            {contract.end_date ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ราคาเช่า/งวด</p>
                          <p className="font-medium">
                            {Number(contract.rent_price).toLocaleString()} บาท
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ระยะเวลาสัญญา</p>
                          <p className="font-medium">
                            {contract.lease_term_months} เดือน
                          </p>
                        </div>
                        {(contract.deposit_amount ?? 0) > 0 && (
                          <div>
                            <p className="text-muted-foreground">เงินประกัน</p>
                            <p className="font-medium">
                              {Number(contract.deposit_amount).toLocaleString()}{" "}
                              บาท
                            </p>
                          </div>
                        )}
                        {(contract.advance_payment_amount ?? 0) > 0 && (
                          <div>
                            <p className="text-muted-foreground">
                              เงินล่วงหน้า
                            </p>
                            <p className="font-medium">
                              {Number(
                                contract.advance_payment_amount,
                              ).toLocaleString()}{" "}
                              บาท
                            </p>
                          </div>
                        )}
                      </div>
                      {contract.other_terms && (
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-1">
                            เงื่อนไขอื่นๆ
                          </p>
                          <p className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                            {contract.other_terms}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {contract.status === "DRAFT" && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
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
                      เซ็นสัญญา
                    </Button>
                  </>
                )}

                {contract.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 gap-1.5"
                    onClick={async () => {
                      if (
                        !confirm(
                          "คุณต้องการหยุดสัญญา/ยกเลิกสัญญา นี้ใช่หรือไม่? (สถานะจะเปลี่ยนเป็น TERMINATED )",
                        )
                      )
                        return;
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
                      } catch (e) {
                        toast.error("ล้มเหลวในการหยุดสัญญา");
                      }
                    }}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    หยุดสัญญา
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(true)}
                >
                  แก้ไข
                </Button>

                {/* Common Delete Button - Disabled unless TERMINATED or DRAFT */}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!["DRAFT", "TERMINATED"].includes(contract.status)}
                  className={`gap-1.5 ${
                    ["DRAFT", "TERMINATED"].includes(contract.status)
                      ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                      : "text-muted-foreground"
                  }`}
                  onClick={async () => {
                    if (!confirm("คุณต้องการลบสัญญานี้ใช่หรือไม่?")) return;
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
                    } catch (e) {
                      toast.error("ล้มเหลวในการลบสัญญา");
                    }
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  ลบสัญญา
                </Button>
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
