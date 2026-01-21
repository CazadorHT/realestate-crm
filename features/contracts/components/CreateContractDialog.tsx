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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parse, isValid, addMonths } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const router = useRouter();

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultEndDate = format(addMonths(new Date(), 12), "yyyy-MM-dd");

  const form = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema),
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
      const res = await upsertContractAction(data);
      if (res.success) {
        toast.success("สร้างสัญญาเรียบร้อย");
        handleClose();
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

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> สร้างสัญญาใหม่
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
        <DialogHeader className="p-6 pb-4 bg-white border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                สร้างสัญญาใหม่
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                กรอกรายละเอียดสัญญาสำหรับดีลที่ปิดการขายแล้ว
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col max-h-[75vh]"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Deal Selection Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="deal_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-bold text-slate-700">
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
                              // Fallback logic for price auto-fill
                              const price =
                                picked.deal_type === "RENT"
                                  ? picked.rental_price ??
                                    picked.original_rental_price
                                  : picked.price ?? picked.original_price;

                              if (price !== undefined && price !== null) {
                                form.setValue("rent_price", price);

                                // For RENT, set default multiples
                                if (picked.deal_type === "RENT") {
                                  form.setValue("deposit_amount", price * 2);
                                  form.setValue(
                                    "advance_payment_amount",
                                    price * 1
                                  );
                                }
                              }

                              if (picked.deal_type === "SALE") {
                                form.setValue("lease_term_months", 1);
                                form.setValue("deposit_amount", 0);
                                form.setValue("advance_payment_amount", 0);
                              } else {
                                form.setValue(
                                  "lease_term_months",
                                  picked.duration_months || 12
                                );
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDeal && (
                  <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 max-w-[600px]">
                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border line-clamp-2 whitespace-normal break-words">
                      {selectedDeal.cover_image_url ? (
                        <img
                          src={selectedDeal.cover_image_url}
                          alt={selectedDeal.property_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                          selectedDeal.deal_type === "RENT"
                            ? "bg-indigo-600 text-white"
                            : "bg-emerald-600 text-white"
                        )}
                      >
                        {selectedDeal.deal_type === "RENT" ? "เช่า" : "ขาย"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 py-1">
                      <h4 className="font-bold text-slate-900 text-base leading-tight truncate">
                        {selectedDeal.property_title}
                      </h4>
                      <p className="text-sm text-slate-600 font-medium">
                        ลูกค้า: {selectedDeal.lead_name}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Display Rental Price with Fallback */}
                        {(selectedDeal.rental_price ||
                          selectedDeal.original_rental_price) && (
                          <div className="flex flex-col">
                            {selectedDeal.original_rental_price &&
                              selectedDeal.rental_price &&
                              selectedDeal.original_rental_price >
                                selectedDeal.rental_price && (
                                <span className="text-[9px] text-slate-400 line-through ml-1">
                                  {selectedDeal.original_rental_price.toLocaleString()}
                                </span>
                              )}
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 font-bold">
                              เช่า:{" "}
                              {(
                                selectedDeal.rental_price ??
                                selectedDeal.original_rental_price
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {/* Display Sale Price with Fallback */}
                        {(selectedDeal.price ||
                          selectedDeal.original_price) && (
                          <div className="flex flex-col">
                            {selectedDeal.original_price &&
                              selectedDeal.price &&
                              selectedDeal.original_price >
                                selectedDeal.price && (
                                <span className="text-[9px] text-slate-400 line-through ml-1">
                                  {selectedDeal.original_price.toLocaleString()}
                                </span>
                              )}
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-bold">
                              ขาย:{" "}
                              {(
                                selectedDeal.price ??
                                selectedDeal.original_price
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedDeal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-in fade-in duration-500">
                  {/* Date 1 */}
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CalendarIcon className="h-4 w-4 text-blue-500" />
                          วันที่เริ่มสัญญา
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date 2 */}
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {isSale ? "วันที่โอน" : "วันที่สิ้นสุดสัญญา"}
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={
                              isSale ? "วว/ดด/ปปปป" : "คำนวณอัตโนมัติ"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="rent_price"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 lg:col-span-1">
                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Wallet className="h-4 w-4 text-emerald-500" />
                          {isSale ? "ราคาขายสุทธิ" : "ราคาค่าเช่าต่อเดือน"}
                        </FormLabel>
                        <FormControl>
                          <PriceInput
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        {(() => {
                          const isRV = selectedDeal.deal_type === "RENT";
                          const curr = isRV
                            ? selectedDeal.rental_price
                            : selectedDeal.price;
                          const orig = isRV
                            ? selectedDeal.original_rental_price
                            : selectedDeal.original_price;
                          if (orig && curr && orig > curr) {
                            return (
                              <p className="text-[10px] text-amber-700 mt-1 font-bold italic">
                                * ราคาโปรโมชั่น (ปกติ {orig.toLocaleString()}{" "}
                                บาท)
                              </p>
                            );
                          }
                          return null;
                        })()}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Rental Term (only for RENT) */}
                  {!isSale && (
                    <FormField
                      control={form.control}
                      name="lease_term_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            ระยะสัญญา (เดือน)
                          </FormLabel>
                          <div className="flex gap-1.5 mb-2">
                            {[12, 24, 36].map((v) => (
                              <Button
                                key={v}
                                type="button"
                                variant={
                                  field.value === v ? "default" : "outline"
                                }
                                size="sm"
                                className={cn(
                                  "h-8 text-[11px] flex-1 font-bold tracking-tight",
                                  field.value === v
                                    ? "bg-blue-600 shadow-sm"
                                    : "text-slate-500"
                                )}
                                onClick={() => field.onChange(v)}
                              >
                                {v / 12} ปี
                              </Button>
                            ))}
                          </div>
                          <FormControl>
                            <Input type="number" {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Deposit & Advance (only for RENT) */}
                  {!isSale && (
                    <>
                      <FormField
                        control={form.control}
                        name="deposit_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-sm font-semibold text-slate-700">
                              <span>เงินประกัน / มัดจำ</span>
                              {rentPrice > 0 && (
                                <div className="flex gap-1">
                                  {[1, 2, 3].map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() =>
                                        field.onChange(m * rentPrice)
                                      }
                                      className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                                        field.value === m * rentPrice
                                          ? "bg-blue-600 text-white shadow-sm scale-110"
                                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                      )}
                                    >
                                      {m} ด.
                                    </button>
                                  ))}
                                </div>
                              )}
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
                            <FormLabel className="flex items-center justify-between text-sm font-semibold text-slate-700">
                              <span>เงินล่วงหน้า</span>
                              {rentPrice > 0 && (
                                <div className="flex gap-1">
                                  {[1, 2, 3].map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() =>
                                        field.onChange(m * rentPrice)
                                      }
                                      className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                                        field.value === m * rentPrice
                                          ? "bg-blue-600 text-white shadow-sm scale-110"
                                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                      )}
                                    >
                                      {m} ด.
                                    </button>
                                  ))}
                                </div>
                              )}
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

                  {/* Other Terms */}
                  <FormField
                    control={form.control}
                    name="other_terms"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            {isSale ? "เงื่อนไขการโอน" : "ข้อกำหนดอื่นๆ"}
                          </FormLabel>
                          {isSale && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2"
                              onClick={() => {
                                const term = "ค่าธรรมเนียมการโอน 50/50";
                                if (!(field.value || "").includes(term)) {
                                  field.onChange(
                                    field.value
                                      ? `${field.value}, ${term}`
                                      : term
                                  );
                                }
                              }}
                            >
                              + โอน 50/50
                            </Button>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            placeholder={
                              isSale
                                ? "ระบุค่าใช้จ่ายการโอน..."
                                : "เช่น จ่ายล่วงหน้า 1 เดือน"
                            }
                            {...field}
                            className="bg-white border-slate-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total Initial Payment Summary */}
                  {!isSale && (
                    <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-600">
                          เงินประกัน
                        </span>
                        <span className="text-sm font-medium">
                          {(form.watch("deposit_amount") || 0).toLocaleString()}{" "}
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
              )}

              {!selectedDeal && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                  <Info className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">
                    รอการเลือกดีลเพื่อแสดงข้อมูลฟอร์ม
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 bg-white border-t gap-3 sm:gap-0">
              <Button
                variant="ghost"
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-slate-500 font-semibold"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 font-bold px-10 h-11 shadow-lg shadow-blue-500/20"
                disabled={isSubmitting || !selectedDealId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก
                  </>
                ) : (
                  "สร้างสัญญา"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
