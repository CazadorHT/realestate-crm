"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  Info,
  Calendar as CalendarIcon,
  Wallet,
  Clock,
  FileText,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parse, isValid, addMonths } from "date-fns";

import {
  ResponsiveDialog,
  DialogClose as ResponsiveDialogClose,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DealCombobox } from "@/features/deals/components/DealCombobox";
import {
  contractFormSchema,
  ContractFormInput,
} from "@/features/rental-contracts/schema";
import { upsertContractAction } from "@/features/rental-contracts/actions";
import { cn } from "@/lib/utils";

import { PriceInput } from "@/components/ui/price-input";
import { DatePicker } from "@/components/ui/date-picker";

export function CreateContractDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const router = useRouter();

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultEndDate = format(addMonths(new Date(), 12), "yyyy-MM-dd");

  const form = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema) as unknown as Resolver<any>,
    mode: "onChange", // Enable real-time validation and dirty tracking
    defaultValues: {
      start_date: todayStr,
      end_date: defaultEndDate,
      rent_price: 0,
      lease_term_months: 12,
      deposit_amount: 0,
      advance_payment_amount: 0,
    },
  });

  async function onSubmit(data: ContractFormInput) {
    setIsSubmitting(true);
    try {
      const res = await upsertContractAction(null, data);
      if (res.success) {
        toast.success("สร้างสัญญาเรียบร้อย");
        // Close form dialog first
        setOpen(false);
        // Show success dialog
        setShowSuccessDialog(true);
        // Refresh data in background
        router.refresh();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    form.reset();
    setSelectedDeal(null);
  };

  const selectedDealId = form.watch("deal_id");
  const rentPrice = form.watch("rent_price");
  const startDate = form.watch("start_date");
  const leaseTerm = form.watch("lease_term_months");
  const isSale = selectedDeal?.deal_type === "SALE";

  // Auto calculate end date when start date or lease term changes
  useEffect(() => {
    if (startDate && leaseTerm && !isSale) {
      const start = new Date(startDate);
      if (isValid(start)) {
        const months =
          typeof leaseTerm === "string" ? parseInt(leaseTerm) : leaseTerm;
        if (!isNaN(months)) {
          const end = addMonths(start, months);
          const endStr = format(end, "yyyy-MM-dd");
          // Only update if different to avoid infinite loops
          if (form.getValues("end_date") !== endStr) {
            form.setValue("end_date", endStr);
          }
        }
      }
    }
  }, [startDate, leaseTerm, isSale, form]);

  const isRental = selectedDeal?.deal_type === "RENT";

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(val) => !val && handleClose()}
        trigger={
          <Button
            onClick={() => setOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-md h-12 rounded-xl font-bold"
          >
            <Plus className="mr-2 h-4 w-4" /> สร้างสัญญาใหม่
          </Button>
        }
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <span>สร้างสัญญาใหม่</span>
          </div>
        }
        description="รายละเอียดสัญญาสำหรับดีลที่ปิดการขายหรือเช่าแล้ว"
        className="sm:max-w-[750px]"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500 order-2 sm:order-1"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/10 order-1 sm:order-2"
              disabled={isSubmitting || !selectedDealId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "สร้างสัญญา"
              )}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form className="space-y-8 py-4">
            {/* Deal Selection Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-bold text-slate-700 ml-1">
                      ดีลที่เกี่ยวข้อง
                    </FormLabel>
                    <FormControl>
                      <DealCombobox
                        value={field.value}
                        status="CLOSED_WIN"
                        onChange={(val, picked) => {
                          field.onChange(val);
                          setSelectedDeal(picked);
                          if (picked) {
                            const price =
                              picked.deal_type === "RENT"
                                ? picked.rental_price ??
                                  picked.original_rental_price
                                : picked.price ?? picked.original_price;

                            const newDefaults: any = {
                              deal_id: val,
                              start_date: todayStr,
                              end_date: defaultEndDate,
                              rent_price: price ?? 0,
                              lease_term_months: 12,
                              deposit_amount: 0,
                              advance_payment_amount: 0,
                            };

                            if (picked.deal_type === "RENT") {
                              newDefaults.deposit_amount = price ? price * 2 : 0;
                              newDefaults.advance_payment_amount = price ?? 0;
                              newDefaults.lease_term_months = picked.duration_months || 12;
                            } else if (picked.deal_type === "SALE") {
                              newDefaults.lease_term_months = 1;
                              newDefaults.deposit_amount = 0;
                              newDefaults.advance_payment_amount = 0;
                            }

                            form.reset(newDefaults);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-400 ml-1">
                      เฉพาะดีลที่ปิดการขาย/เช่าแล้วเท่านั้น
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedDeal && (
                <div className="flex flex-row gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100 shadow-inner">
                    {selectedDeal.cover_image_url ? (
                      <img
                        src={selectedDeal.cover_image_url}
                        alt={selectedDeal.property_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Plus className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        selectedDeal.deal_type === "RENT"
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-600 text-white",
                      )}
                    >
                      {selectedDeal.deal_type === "RENT" ? "เช่า" : "ขาย"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-base sm:text-lg leading-tight line-clamp-2">
                        {selectedDeal.property_title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="truncate">{selectedDeal.location || "ไม่ระบุทำเล"}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">ลูกค้า:</span>
                        <span className="text-blue-600 font-bold truncate">{selectedDeal.lead_name}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-slate-50">
                      {selectedDeal.deal_type === "RENT" ? (
                        <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-2">
                          <span className="text-[10px] font-bold opacity-60">PRICE:</span>
                          <span className="text-xs font-bold">฿{(selectedDeal.rental_price ?? selectedDeal.original_rental_price ?? 0).toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-2">
                          <span className="text-[10px] font-bold opacity-60">PRICE:</span>
                          <span className="text-xs font-bold">฿{(selectedDeal.price ?? selectedDeal.original_price ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedDeal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-500">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        วันที่เริ่มสัญญา
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {isSale ? "วันที่โอน" : "วันที่สิ้นสุดสัญญา"}
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          placeholder={isSale ? "วว/ดด/ปปปป" : "คำนวณอัตโนมัติ"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rent_price"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 lg:col-span-1">
                      <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                        <Wallet className="h-4 w-4 text-emerald-500" />
                        {isSale ? "ราคาขายสุทธิ" : "ราคาค่าเช่าต่อเดือน"}
                      </FormLabel>
                      <FormControl>
                        <PriceInput
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isSale && (
                  <FormField
                    control={form.control}
                    name="lease_term_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700 ml-1">
                          ระยะสัญญา (เดือน)
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              {[12, 24, 36].map((v) => (
                                <Button
                                  key={v}
                                  type="button"
                                  variant={field.value === v ? "default" : "outline"}
                                  size="sm"
                                  className={cn(
                                    "flex-1 h-9 rounded-xl font-bold transition-all",
                                    field.value === v ? "bg-blue-600 text-white border-blue-600" : "text-slate-500"
                                  )}
                                  onClick={() => field.onChange(v)}
                                >
                                  {v / 12} ปี
                                </Button>
                              ))}
                            </div>
                            <Input type="number" {...field} className="h-11 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isSale && (
                  <>
                    <FormField
                      control={form.control}
                      name="deposit_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between text-sm font-bold text-slate-700 ml-1">
                            <span>เงินประกัน / มัดจำ</span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => field.onChange(m * (rentPrice || 0))}
                                  className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all",
                                    field.value === m * (rentPrice || 0)
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  )}
                                >
                                  {m} ด.
                                </button>
                              ))}
                            </div>
                          </FormLabel>
                          <FormControl>
                            <PriceInput
                              value={field.value || 0}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="advance_payment_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between text-sm font-bold text-slate-700 ml-1">
                            <span>เงินล่วงหน้า</span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => field.onChange(m * (rentPrice || 0))}
                                  className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all",
                                    field.value === m * (rentPrice || 0)
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  )}
                                >
                                  {m} ด.
                                </button>
                              ))}
                            </div>
                          </FormLabel>
                          <FormControl>
                            <PriceInput
                              value={field.value || 0}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="other_terms"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <FormLabel className="text-sm font-bold text-slate-700">
                          {isSale ? "เงื่อนไขการโอน" : "ข้อกำหนดอื่นๆ"}
                        </FormLabel>
                        {isSale && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                            onClick={() => {
                              const term = "ค่าธรรมเนียมการโอน 50/50";
                              if (!(field.value || "").includes(term)) {
                                field.onChange(field.value ? `${field.value}, ${term}` : term);
                              }
                            }}
                          >
                            + โอน 50/50
                          </Button>
                        )}
                      </div>
                      <FormControl>
                        <Input
                          placeholder={isSale ? "ระบุค่าใช้จ่ายการโอน..." : "เช่น จ่ายล่วงหน้า 1 เดือน"}
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isSale && (
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-sm font-medium">เงินประกัน</span>
                      <span className="text-sm font-bold">฿{(form.watch("deposit_amount") || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pb-3 border-b border-slate-200/50">
                      <span className="text-sm font-medium">เงินล่วงหน้า</span>
                      <span className="text-sm font-bold">฿{(form.watch("advance_payment_amount") || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-slate-800">รวมยอดชำระแรกเข้า</span>
                      <span className="text-xl font-black text-blue-600">
                        ฿{((form.watch("deposit_amount") || 0) + (form.watch("advance_payment_amount") || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedDeal && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                <Info className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-bold">กรุณาเลือกดีลที่ต้องการสร้างสัญญา</p>
              </div>
            )}
          </form>
        </Form>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        className="sm:max-w-md"
      >
        <div className="flex flex-col items-center text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-green-600 shadow-sm" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">สร้างสัญญาเรียบร้อยแล้ว</h3>
            <p className="text-slate-500 text-sm font-medium px-4">
              สัญญาถูกบันทึกเข้าระบบเรียบร้อย คุณสามารถจัดการแจ้งเตือนหรือพิมพ์เอกสารได้ทันที
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full px-2">
            {isRental && (
              <Button
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100"
                onClick={() => {
                  handleClose();
                  setShowSuccessDialog(false);
                  router.push("/protected/rent-notifications");
                }}
              >
                ไปตั้งค่าแจ้งเตือนค่าเช่า
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-600"
              onClick={() => {
                handleClose();
                setShowSuccessDialog(false);
                const url = new URL(window.location.href);
                url.searchParams.set("success", "true");
                router.push(url.pathname + url.search);
              }}
            >
              ตกลง
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}