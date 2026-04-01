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
import { Loader2, Plus, Save } from "lucide-react";
import { RiEdit2Line } from "react-icons/ri";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TopLoader } from "@/components/ui/top-loader";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
import { PropertyCombobox } from "@/components/PropertyCombobox";
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
    mode: "onChange",
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
      const sanitized: any = {
        ...deal,
        deal_type: deal.deal_type ?? "RENT",
      };
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

  const propertyId = form.watch("property_id");
  const dealType = form.watch("deal_type");

  useEffect(() => {
    if (!propertyId || !dealType) return;

    const selectedProperty = properties.find((p) => p.id === propertyId);
    if (!selectedProperty) return;

    let calculatedCommission = 0;

    if (dealType === "SALE") {
      const price =
        selectedProperty.price || selectedProperty.original_price || 0;
      const percentage = selectedProperty.commission_sale_percentage || 3;
      calculatedCommission = (price * percentage) / 100;
    } else if (dealType === "RENT") {
      const rentalPrice =
        selectedProperty.rental_price ||
        selectedProperty.original_rental_price ||
        0;
      const months = selectedProperty.commission_rent_months || 1;
      calculatedCommission = rentalPrice * months;
    }

    form.setValue("commission_amount", calculatedCommission);
  }, [propertyId, dealType, properties, form]);

  const onSubmit = (data: CreateDealInput) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;

    setIsSubmitting(true);
    try {
      const result: any =
        isEditing && deal
          ? await updateDealAction({ ...pendingData, id: deal.id })
          : await createDealAction(pendingData);

      if (result.success) {
        toast.success(isEditing ? "อัปเดตดีลเรียบร้อย" : "สร้างดีลเรียบร้อย");
        setIsConfirmOpen(false);
        setOpen(false);
        if (!isEditing) form.reset();

        if (onSuccess) onSuccess();
        if (refreshOnSuccess) {
          const url = new URL(window.location.href);
          url.searchParams.set("success", "true");
          router.push(url.pathname + url.search);
          router.refresh();
        }
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
        setIsConfirmOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก");
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? "แก้ไขดีล" : "สร้างดีลใหม่"}
      description="กรอกข้อมูลดีลที่เกี่ยวข้อง (วันที่เป็นค่าสามารถเว้นว่างได้)"
      className="md:max-w-4xl"
      trigger={
        trigger ||
        (deal ? (
          <Button className="bg-white/20 cursor-pointer text-white border-0 hover:bg-white/30 transition-all hover:scale-105 active:scale-95 rounded-xl">
            <RiEdit2Line className="h-4 w-4 mr-2" />
            แก้ไข
          </Button>
        ) : (
          <Button size="sm" className="rounded-xl px-4 font-bold">
            <Plus className="mr-2 h-4 w-4" />
            สร้าง Deal
          </Button>
        ))
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
              setOpen(false);
            }}
            className="flex-1 sm:flex-none h-12 px-6 text-slate-500 hover:text-slate-800 font-bold rounded-xl border border-slate-100"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            disabled={
              isSubmitting ||
              !form.formState.isValid ||
              (!isEditing && !form.formState.isDirty)
            }
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1 h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all gap-2 font-bold disabled:opacity-50 disabled:grayscale"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                บันทึกข้อมูลดีล
              </>
            )}
          </Button>
        </div>
      }
    >
      <TopLoader isLoading={isSubmitting} />
      <Form {...form}>
        <form className="space-y-6 py-2 text-left">
          {/* Property Selection */}
          <FormField
            control={form.control}
            name="property_id"
            render={({ field }) => (
              <FormItem className="w-full min-w-0">
                <FormLabel className="text-slate-700 font-bold">เลือกทรัพย์ *</FormLabel>
                <FormControl>
                  <PropertyCombobox
                    value={field.value}
                    onChange={(id) => field.onChange(id)}
                    placeholder="พิมพ์เพื่อค้นหาทรัพย์..."
                    initialProperty={
                      deal?.property
                        ? { id: deal.property.id, title: deal.property.title }
                        : undefined
                    }
                  />
                </FormControl>
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
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm shadow-sm">
                  <div className="flex flex-row gap-4 items-center">
                    {p.cover_image && (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full rounded-xl object-cover border border-slate-200 shadow-sm"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate mb-0.5 line-clamp-1 max-w-[450px]">
                        {p.title}
                      </div>
                      {p.popular_area && (
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          📍 {p.popular_area}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {rentalPrice ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                              เช่า:
                            </span>{" "}
                            <span className="font-bold text-blue-700">
                              {new Intl.NumberFormat("th-TH").format(
                                rentalPrice,
                              )}{" "}
                            </span>
                            {p.commission_rent_months && (
                              <span className="text-[10px] text-slate-400 ml-1 hidden sm:inline">
                                (คอม {p.commission_rent_months} ด.)
                              </span>
                            )}
                          </div>
                        ) : null}
                        {salePrice ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                              ขาย:
                            </span>{" "}
                            <span className="font-bold text-emerald-700">
                              {new Intl.NumberFormat("th-TH").format(
                                salePrice,
                              )}{" "}
                            </span>
                            {p.commission_sale_percentage && (
                              <span className="text-[10px] text-slate-400 ml-1 hidden sm:inline">
                                (คอม {p.commission_sale_percentage}%)
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Lead Selection */}
          {!leadId && (
            <FormField
              control={form.control}
              name="lead_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">เลือกลีด *</FormLabel>
                  <LeadSelect value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Deal Type, Status & Commission */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="deal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">ประเภทดีล</FormLabel>
                  <div className="flex gap-2">
                    {[
                      { value: "RENT", label: "🏠 เช่า" },
                      { value: "SALE", label: "💰 ซื้อ" },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={field.value === opt.value ? "default" : "outline"}
                        onClick={() => field.onChange(opt.value)}
                        className={`flex-1 h-11 rounded-xl font-bold transition-all ${
                          field.value === opt.value
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                            : "text-slate-600"
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">สถานะ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="NEGOTIATING" className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-400" />
                          <span className="font-medium">เจรจาต่อรอง</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SIGNED" className="py-3">
                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                          <span>ทำสัญญาแล้ว (รอดำเนินการ)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CLOSED_WIN" className="py-3">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <span>โอน/ส่งมอบ/ได้รับคอม</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CLOSED_LOSS" className="py-3">
                        <div className="flex items-center gap-2 text-rose-600 font-bold">
                          <div className="h-2 w-2 rounded-full bg-rose-500" />
                          <span>ปิดการขายล้มเหลว</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">คอมมิชชั่น (บาท)</FormLabel>
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
                      className="font-bold text-right h-11 rounded-xl border-slate-300 focus:ring-blue-500/10 text-emerald-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Transaction Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">
                    {dealType === "SALE" ? "วันที่โอน" : "วันที่เริ่มสัญญา"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value || ""}
                      className="h-11 rounded-xl border-slate-200"
                      onChange={(e) => field.onChange(e.target.value || undefined)}
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
                    <FormLabel className="text-slate-700 font-bold">
                      ระยะเวลาสัญญา ({field.value ? field.value / 12 : 0} ปี)
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex flex-1 gap-2">
                          {[1, 2, 3].map((year) => {
                            const months = year * 12;
                            const isSelected = field.value === months;
                            return (
                              <Button
                                key={year}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={`flex-1 h-11 rounded-xl font-bold transition-all ${
                                  isSelected
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100"
                                    : "text-slate-600 border-slate-200"
                                }`}
                                onClick={() => field.onChange(months)}
                              >
                                {year} ปี
                              </Button>
                            );
                          })}
                        </div>
                        <div className="relative flex items-center gap-2 min-w-[100px] flex-1">
                          <Input
                            type="number"
                            placeholder="ปี"
                            className="text-center h-11 rounded-xl border-slate-200 pr-8"
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
                          <span className="absolute right-3 text-xs text-slate-400 font-bold">ปี</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Co-Agent Info */}
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Co-Agent Information (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="co_agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 text-xs font-bold">ชื่อ Co-Agent</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="ชื่อผู้ประสานงาน"
                        className="h-10 rounded-xl border-slate-200"
                        onChange={(e) => field.onChange(e.target.value || undefined)}
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
                    <FormLabel className="text-slate-600 text-xs font-bold">เบอร์โทรศัพท์</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="081-xxx-xxxx"
                        className="h-10 rounded-xl border-slate-200"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
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
                    <FormLabel className="text-slate-600 text-xs font-bold">Facebook / LINE</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LINE:@id หรือ FB Name"
                        className="h-10 rounded-xl border-slate-200"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
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
    </ResponsiveDialog>
  );
}
