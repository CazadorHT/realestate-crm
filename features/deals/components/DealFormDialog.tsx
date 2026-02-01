"use client";

import { useState, useEffect } from "react";
import { differenceInMonths } from "date-fns";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealSchema, CreateDealInput } from "../schema";
import { createDealAction, updateDealAction } from "../actions";
import { DealWithProperty, DealPropertyOption } from "../types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { LeadSelect } from "./LeadSelect";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DealFormDialogProps {
  leadId: string;
  properties?: DealPropertyOption[];
  deal?: DealWithProperty; // Existing deal for editing
  onSuccess?: () => void;
  refreshOnSuccess?: boolean;
  trigger?: React.ReactNode;
}

export function DealFormDialog({
  leadId,
  properties = [],
  deal,
  onSuccess,
  refreshOnSuccess,
  trigger,
}: DealFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<CreateDealInput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEditing = !!deal;

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema) as unknown as Resolver<any>,
    defaultValues: {
      lead_id: leadId || "",
      deal_type: deal?.deal_type || "RENT",
      status: deal?.status || "NEGOTIATING",
      commission_amount: deal?.commission_amount ?? undefined,
      transaction_date:
        deal?.transaction_date ||
        (!deal ? new Date().toISOString().split("T")[0] : undefined),
      duration_months:
        deal?.transaction_date && deal?.transaction_end_date
          ? differenceInMonths(
              new Date(deal.transaction_end_date),
              new Date(deal.transaction_date),
            )
          : 12, // Default 1 year
      property_id: deal?.property_id || "",
      co_agent_name: deal?.co_agent_name ?? undefined,
      co_agent_contact: deal?.co_agent_contact ?? undefined,
      co_agent_online: deal?.co_agent_online ?? undefined,
    },
  });

  // Reset form when deal changes (sanitize nulls to undefined for optional fields)
  useEffect(() => {
    if (deal) {
      // Manual mapping to satisfy Type check, though direct spread might work if types aligned perfectly
      // We need to cast strict nulls to undefined for the form
      const sanitized: any = {
        ...deal,
        deal_type: deal.deal_type ?? "RENT", // Default fallback if null (shouldn't be)
      };
      // Optional text fields that may be `null` in DB should be `undefined` for zod optional
      [
        "co_agent_name",
        "co_agent_contact",
        "co_agent_online",
        "source",
      ].forEach((k) => {
        if (sanitized[k] === null) sanitized[k] = undefined;
      });
      if (sanitized.transaction_date === null)
        sanitized.transaction_date = undefined;
      else if (sanitized.transaction_date)
        sanitized.transaction_date = sanitized.transaction_date.split("T")[0];

      if (sanitized.transaction_end_date === null)
        sanitized.transaction_end_date = undefined;
      else if (sanitized.transaction_end_date)
        sanitized.transaction_end_date =
          sanitized.transaction_end_date.split("T")[0];

      // Fix: Don't force duration_months to undefined, let it use existing or re-calc
      // sanitized.duration_months = undefined;

      // Ensure duration is calculated if we have dates but no explicit duration
      if (
        !sanitized.duration_months &&
        sanitized.transaction_date &&
        sanitized.transaction_end_date
      ) {
        sanitized.duration_months = differenceInMonths(
          new Date(sanitized.transaction_end_date),
          new Date(sanitized.transaction_date),
        );
      }

      form.reset(sanitized);
    } else {
      // For new deals, ensure defaults are set (like today's date)
      form.reset({
        lead_id: leadId || "",
        deal_type: "RENT",
        status: "NEGOTIATING",
        commission_amount: undefined,
        transaction_date: new Date().toISOString().split("T")[0],
        duration_months: 12,
        property_id: "",
        co_agent_name: undefined,
        co_agent_contact: undefined,
        co_agent_online: undefined,
      });
    }
  }, [deal, leadId, form]);

  // Create watchers for dependency tracking
  const propertyId = form.watch("property_id");
  const dealType = form.watch("deal_type");

  // Auto-calculate commission based on property and deal type
  useEffect(() => {
    if (!propertyId || !dealType) return;

    const selectedProperty = properties.find((p) => p.id === propertyId);
    if (!selectedProperty) return;

    let calculatedCommission = 0;

    if (dealType === "SALE") {
      // Use price, fallback to original_price
      const price =
        selectedProperty.price || selectedProperty.original_price || 0;
      const percentage = selectedProperty.commission_sale_percentage || 3; // Default 3%
      calculatedCommission = (price * percentage) / 100;
    } else if (dealType === "RENT") {
      // Use rental_price, fallback to original_rental_price
      const rentalPrice =
        selectedProperty.rental_price ||
        selectedProperty.original_rental_price ||
        0;
      const months = selectedProperty.commission_rent_months || 1; // Default 1 month
      calculatedCommission = rentalPrice * months;
    }

    form.setValue("commission_amount", calculatedCommission);
  }, [propertyId, dealType, properties, form]);

  const onSubmit = (data: CreateDealInput) => {
    // Open confirmation instead of submitting immediately
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;

    setIsSubmitting(true);
    try {
      const result =
        isEditing && deal
          ? await updateDealAction({ ...pendingData, id: deal.id })
          : await createDealAction(pendingData);

      if (result.success) {
        toast.success(isEditing ? "อัปเดตดีลเรียบร้อย" : "สร้างดีลเรียบร้อย");
        setIsConfirmOpen(false);
        setOpen(false);
        if (!isEditing) form.reset();

        if (onSuccess) onSuccess();
        if (refreshOnSuccess) router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        setIsConfirmOpen(false);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            สร้าง Deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขดีล" : "สร้างดีลใหม่"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            กรอกข้อมูลดีลที่เกี่ยวข้อง (วันที่เป็นค่าสามารถเว้นว่างได้)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-6 pr-2 py-1"
          >
            {/* Property Selection */}
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem className="w-full overflow-hidden">
                  <FormLabel>เลือกทรัพย์ *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder="เลือกทรัพย์ที่ต้องการ"
                          className="truncate"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[400px] w-(--radix-select-trigger-width)">
                      {properties.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="truncate"
                        >
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Price Info */}
            {propertyId &&
              (() => {
                const p = properties.find((prop) => prop.id === propertyId);
                if (!p) return null;
                const rentalPrice = p.rental_price || p.original_rental_price;
                const salePrice = p.price || p.original_price;
                return (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm">
                    <div className="flex gap-3">
                      {/* Cover Image - on top */}
                      {p.cover_image && (
                        <div className="">
                          <img
                            src={p.cover_image}
                            alt={p.title}
                            className="w-48 h-48 rounded-lg object-cover border border-slate-200"
                          />
                        </div>
                      )}
                      {/* Price Info */}
                      <div className="flex flex-col gap-3">
                        {rentalPrice ? (
                          <div>
                            <span className="text-slate-500">ค่าเช่า:</span>{" "}
                            <span className="font-bold text-blue-700">
                              {new Intl.NumberFormat("th-TH").format(
                                rentalPrice,
                              )}{" "}
                              ฿/ด.
                            </span>
                            {p.commission_rent_months && (
                              <span className="text-xs text-slate-500 ml-1">
                                (คอม {p.commission_rent_months} ด.)
                              </span>
                            )}
                          </div>
                        ) : null}
                        {salePrice ? (
                          <div>
                            <span className="text-slate-500">ราคาขาย:</span>{" "}
                            <span className="font-bold text-green-700">
                              {new Intl.NumberFormat("th-TH").format(salePrice)}{" "}
                              ฿
                            </span>
                            {p.commission_sale_percentage && (
                              <span className="text-xs text-slate-500 ml-1">
                                (คอม {p.commission_sale_percentage}%)
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Lead Selection - shown only when parent didn't pass a leadId */}
            {!leadId && (
              <FormField
                control={form.control}
                name="lead_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลือกลีด *</FormLabel>
                    <LeadSelect value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Deal Type, Status & Commission - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Deal Type as Toggle Buttons */}
              <FormField
                control={form.control}
                name="deal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทดีล</FormLabel>
                    <div className="flex gap-2">
                      {[
                        { value: "RENT", label: "🏠 เช่า" },
                        { value: "SALE", label: "💰 ซื้อ" },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            field.value === opt.value ? "default" : "outline"
                          }
                          onClick={() => field.onChange(opt.value)}
                          className={`flex-1 ${
                            field.value === opt.value
                              ? "bg-blue-600 hover:bg-blue-700"
                              : ""
                          }`}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEGOTIATING">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                            <span>เจรจาต่อรอง</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="SIGNED">
                          <div className="flex items-center gap-2 text-blue-600 font-medium">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>ทำสัญญาแล้ว (รอดำเนินการ)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="CLOSED_WIN">
                          <div className="flex items-center gap-2 text-emerald-600 font-medium">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>โอน/ส่งมอบ/ได้รับคอมมิชชัน</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="CLOSED_LOSS">
                          <div className="flex items-center gap-2 text-rose-600">
                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                            <span>ปิดการขาย/เช่าไม่สำเร็จ</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Commission */}
              <FormField
                control={form.control}
                name="commission_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ค่าคอมมิชชั่น (บาท)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={
                          field.value != null
                            ? new Intl.NumberFormat("th-TH").format(field.value)
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (raw === "") {
                            field.onChange(undefined);
                          } else {
                            const num = Number(raw);
                            if (!isNaN(num)) {
                              field.onChange(num);
                            }
                          }
                        }}
                        className="font-semibold text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Transaction Dates & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dealType === "SALE" ? "วันที่โอน" : "วันที่เริ่มสัญญา"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {dealType === "RENT" && (
                <FormField
                  control={form.control}
                  name="duration_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ระยะเวลาสัญญา (ปี)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[1, 2, 3].map((year) => {
                            const months = year * 12;
                            const isSelected = field.value === months;
                            return (
                              <Button
                                key={year}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="lg"
                                className={`flex-1  ${
                                  isSelected
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "text-slate-600"
                                }`}
                                onClick={() => field.onChange(months)}
                              >
                                {year} ปี
                              </Button>
                            );
                          })}
                          <Input
                            type="number"
                            placeholder="ระบุ"
                            className="w-[80px] text-center h-10"
                            value={field.value ? String(field.value / 12) : ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") {
                                field.onChange(undefined);
                                return;
                              }
                              const years = parseFloat(v);
                              if (!isNaN(years)) {
                                field.onChange(years * 12);
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="co_agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ Co-Agent (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="ชื่อ Co-Agent"
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์ Co-Agent</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น 081-xxx-xxxx"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_online"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ช่องทางติดต่อ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ตัวอย่าง: LINE:@agent, Facebook, Email"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    บันทึก
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title={isEditing ? "ยืนยันการแก้ไขดีล" : "ยืนยันการสร้างดีล"}
          description={
            isEditing
              ? "คุณต้องการบันทึกการเปลี่ยนแปลงของดีลนี้ใช่หรือไม่?"
              : "ข้อมูลดีลถูกต้องและคุณต้องการบันทึกข้อมูลใช่หรือไม่?"
          }
          confirmText={isEditing ? "บันทึกการแก้ไข" : "บันทึกดีล"}
          cancelText="ตรวจสอบอีกรอบ"
          onConfirm={handleConfirmSave}
        />
      </DialogContent>
    </Dialog>
  );
}
