"use client";

import React, { useMemo } from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "../components/NumberInput";
import { SectionHeader } from "../components/SectionHeader";
import { UnitNumberField } from "../components/UnitNumberField";
import type { Step2Props } from "../types";
import {
  Banknote,
  LayoutGrid,
  Maximize2,
  FileText,
  Percent,
  Lock,
  TrendingDown,
  Sparkles,
  Info,
  PawPrint,
  ShieldCheck,
  PlusCircleIcon,
} from "lucide-react";

// Helper for smooth height animations
function CollapsibleSection({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,padding] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

export const Step2Details = React.memo(Step2DetailsComponent);
function Step2DetailsComponent({ form, mode }: Step2Props) {
  const listingType = form.watch("listing_type");
  const isReadOnly =
    mode === ("view" as any) ||
    mode === ("readonly" as any) ||
    mode === ("read" as any);

  const showSale = listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRent = listingType === "RENT" || listingType === "SALE_AND_RENT";

  // State for showing discount fields
  const [showSaleDiscount, setShowSaleDiscount] = React.useState(false);
  const [showRentDiscount, setShowRentDiscount] = React.useState(false);
  const [showCommonFee, setShowCommonFee] = React.useState(false);

  // Auto-open discount fields ONLY if there's an actual discount
  const saleOriginal = form.watch("original_price");
  const rentOriginal = form.watch("original_rental_price");
  const salePrice = form.watch("price");
  const rentPrice = form.watch("rental_price");
  const maintenanceFee = form.watch("maintenance_fee");

  React.useEffect(() => {
    // เปิดเฉพาะเมื่อมี original_price และ มากกว่า price (มีส่วนลดจริง)
    if (saleOriginal && salePrice && saleOriginal > salePrice) {
      setShowSaleDiscount(true);
    }
  }, [saleOriginal, salePrice]);

  React.useEffect(() => {
    // เปิดเฉพาะเมื่อมี original_rental_price และ มากกว่า rental_price (มีส่วนลดจริง)
    if (rentOriginal && rentPrice && rentOriginal > rentPrice) {
      setShowRentDiscount(true);
    }
  }, [rentOriginal, rentPrice]);

  React.useEffect(() => {
    // Auto open maintenance fee if it has value
    if (maintenanceFee && maintenanceFee > 0) {
      setShowCommonFee(true);
    }
  }, [maintenanceFee]);

  // สำหรับสรุปส่วนลด

  const saleDiscount =
    saleOriginal && salePrice && saleOriginal > salePrice
      ? {
          amount: saleOriginal - salePrice,
          percent: Math.round(
            ((saleOriginal - salePrice) / saleOriginal) * 100,
          ),
        }
      : null;

  const rentDiscount =
    rentOriginal && rentPrice && rentOriginal > rentPrice
      ? {
          amount: rentOriginal - rentPrice,
          percent: Math.round(
            ((rentOriginal - rentPrice) / rentOriginal) * 100,
          ),
        }
      : null;

  // Commission Preview Calculations
  const commissionSalePercent = form.watch("commission_sale_percentage");
  const commissionRentMonths = form.watch("commission_rent_months");

  const saleCommissionPreview = useMemo(() => {
    const price = saleOriginal || salePrice;
    const percent = commissionSalePercent;
    if (price && percent && price > 0 && percent > 0) {
      return (price * percent) / 100;
    }
    return null;
  }, [saleOriginal, salePrice, commissionSalePercent]);

  const rentCommissionPreview = useMemo(() => {
    const rent = rentOriginal || rentPrice;
    const months = commissionRentMonths;
    if (rent && months && rent > 0 && months > 0) {
      return rent * months;
    }
    return null;
  }, [rentOriginal, rentPrice, commissionRentMonths]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-6 duration-500 grid ">
      {/* ===== PRICE & CONDITIONS ===== */}
      <Card className="border-slate-200/70 bg-white/80 ">
        <CardHeader className="space-y-4 ">
          <SectionHeader
            icon={Banknote}
            title="ราคาและเงื่อนไข"
            desc="กรอกให้ครบเพื่อให้ระบบจัดอันดับและแสดงดีลได้แม่นยำ"
            tone="blue"
          />
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-12 gap-8 lg:gap-10 relative">
            {/* Vertical Separator for Dual Mode (Large Screens) */}
            {showSale && showRent && (
              <div className="hidden lg:block absolute left-1/3 top-0 bottom-0 w-px bg-slate-100 -ml-2" />
            )}
            {showSale && showRent && (
              <div className="hidden lg:block absolute right-1/3 top-0 bottom-0 w-px bg-slate-100 -mr-2" />
            )}

            {/* ================= SALE ZONE ================= */}
            {showSale && (
              <div
                className={`${
                  showSale && showRent
                    ? "col-span-12 lg:col-span-4"
                    : "col-span-12 max-w-2xl"
                } space-y-6`}
              >
                {/* Header for Dual Mode */}
                {showSale && showRent && (
                  <div className="flex items-center gap-3 border-b border-slate-50">
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-medium text-slate-900">
                      ข้อมูลการขาย (For Sale)
                    </h4>
                  </div>
                )}

                <div className="space-y-6 ">
                  {/* Warning: Invalid Discount */}
                  {showSaleDiscount &&
                    saleOriginal &&
                    salePrice &&
                    saleOriginal <= salePrice && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm flex gap-3 text-amber-800">
                        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">ตรวจสอบราคา</p>
                          <p className="text-xs opacity-90">
                            ราคาเต็มต้องมากกว่าราคาพิเศษ
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Main Price Field */}
                  <UnitNumberField
                    label={
                      showSaleDiscount ? "ราคาเต็ม (ก่อนลด)" : "ราคาขายสุทธิ"
                    }
                    name="original_price"
                    control={form.control}
                    placeholder="0"
                    suffix="฿"
                    disabled={isReadOnly}
                    emphasize={!showSaleDiscount} // Emphasize if it's the only price
                    required
                    size="default"
                    className={
                      showSaleDiscount
                        ? "text-slate-500 bg-slate-50/50"
                        : "text-md font-medium "
                    }
                  />

                  {/* Discount Section */}
                  <div className="space-y-3">
                    <CollapsibleSection open={!showSaleDiscount}>
                      <button
                        type="button"
                        onClick={() => setShowSaleDiscount(true)}
                        disabled={isReadOnly}
                        className="group flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-2"
                      >
                        <PlusCircleIcon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        <span>เพิ่มราคาพิเศษ / ส่วนลด</span>
                      </button>
                    </CollapsibleSection>

                    <CollapsibleSection open={showSaleDiscount}>
                      <div className="border-l-2 border-blue-100 pl-4 py-1 space-y-4">
                        <UnitNumberField
                          label="ราคาพิเศษ (โชว์หน้าเว็บ)"
                          name="price"
                          control={form.control}
                          placeholder="0"
                          suffix="฿"
                          disabled={isReadOnly || !showSaleDiscount}
                          emphasize
                          size="default"
                          labelClassName="flex items-center justify-between gap-3 text-slate-500 text-sm"
                          className="text-md font-medium text-blue-700 border-blue-200"
                          action={
                            <button
                              type="button"
                              onClick={() => {
                                setShowSaleDiscount(false);
                                form.setValue("price", null);
                              }}
                              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                              ยกเลิกส่วนลด
                            </button>
                          }
                        />
                      </div>
                    </CollapsibleSection>
                  </div>

                  {/* Common Fee */}
                  <div className="">
                    <CollapsibleSection open={!showCommonFee}>
                      <button
                        type="button"
                        onClick={() => setShowCommonFee(true)}
                        disabled={isReadOnly}
                        className="group flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors py-2"
                      >
                        <PlusCircleIcon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        <span>เพิ่มค่าส่วนกลาง (ถ้ามี)</span>
                      </button>
                    </CollapsibleSection>

                    <CollapsibleSection open={showCommonFee}>
                      <div className="border-l-2 border-slate-100 pl-4 py-2">
                        <UnitNumberField
                          label="ค่าส่วนกลาง (ต่อปี)"
                          name="maintenance_fee"
                          control={form.control}
                          placeholder="0"
                          suffix="฿"
                          disabled={isReadOnly}
                          size="default"
                          labelClassName="flex items-center justify-between gap-3 text-slate-500 text-sm"
                          action={
                            <button
                              type="button"
                              onClick={() => {
                                setShowCommonFee(false);
                                form.setValue("maintenance_fee", null);
                              }}
                              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                              ยกเลิกค่าส่วนกลาง
                            </button>
                          }
                        />
                      </div>
                    </CollapsibleSection>
                  </div>
                </div>
              </div>
            )}

            {/* ================= RENT ZONE ================= */}
            {showRent && (
              <div
                className={`${
                  showSale && showRent
                    ? "col-span-12 lg:col-span-4"
                    : "col-span-12 max-w-2xl"
                } space-y-6`}
              >
                {/* Header for Dual Mode */}
                {showSale && showRent && (
                  <div className="flex items-center gap-3 border-b border-slate-50">
                    <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">
                      ข้อมูลการเช่า (For Rent)
                    </h4>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Warning: Invalid Discount */}
                  {showRentDiscount &&
                    rentOriginal &&
                    rentPrice &&
                    rentOriginal <= rentPrice && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm flex gap-3 text-amber-800">
                        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">ตรวจสอบราคา</p>
                          <p className="text-xs opacity-90">
                            ราคาเต็มต้องมากกว่าราคาพิเศษ
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Main Rent Price */}
                  <UnitNumberField
                    label={
                      showRentDiscount
                        ? "ค่าเช่าเต็ม (ก่อนลด)"
                        : "ค่าเช่าต่อเดือน"
                    }
                    name="original_rental_price"
                    control={form.control}
                    placeholder="0"
                    suffix="฿"
                    disabled={isReadOnly}
                    emphasize={!showRentDiscount}
                    required
                    size="default"
                    className={
                      showRentDiscount
                        ? "text-slate-500 bg-slate-50/50"
                        : "text-md font-medium"
                    }
                  />

                  {/* Discount Section */}
                  <div className="space-y-1">
                    {/* Add Percentage Button */}
                    <CollapsibleSection open={!showRentDiscount}>
                      <button
                        type="button"
                        onClick={() => setShowRentDiscount(true)}
                        disabled={isReadOnly}
                        className="group flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-2 "
                      >
                        <PlusCircleIcon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        <span>เพิ่มราคาโปรโมชั่น</span>
                      </button>
                    </CollapsibleSection>

                    {/* Discount Input */}
                    <CollapsibleSection open={showRentDiscount}>
                      <div className="border-l-2 border-orange-100 pl-4 py-1 space-y-4">
                        {/* Warning: Invalid Discount - Moved inside */}
                        {rentOriginal &&
                          rentPrice &&
                          rentOriginal <= rentPrice && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm flex gap-3 text-amber-800 animate-in fade-in slide-in-from-top-1">
                              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">ตรวจสอบราคา</p>
                                <p className="text-xs opacity-90">
                                  ราคาเต็มต้องมากกว่าราคาพิเศษ
                                </p>
                              </div>
                            </div>
                          )}

                        <UnitNumberField
                          label="ค่าเช่าพิเศษ (โชว์หน้าเว็บ)"
                          name="rental_price"
                          control={form.control}
                          placeholder="0"
                          suffix="฿"
                          disabled={isReadOnly || !showRentDiscount}
                          emphasize
                          size="default"
                          className="text-md font-medium text-orange-700 border-orange-200"
                          labelClassName="flex items-center justify-between gap-3 text-slate-500 text-sm"
                          action={
                            <button
                              type="button"
                              onClick={() => {
                                setShowRentDiscount(false);
                                form.setValue("rental_price", null);
                              }}
                              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                              ยกเลิกโปรโมชั่น
                            </button>
                          }
                        />
                      </div>
                    </CollapsibleSection>
                  </div>

                  {/* Contract Duration */}
                  
                  <div className="pt-2 ">
                          <div className="border-l-2 border-slate-100 pl-4 py-2">
                    <FormField
                      control={form.control}
                      name="min_contract_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between text-sm text-slate-500 font-normal ">
                            <span>สัญญาขั้นต่ำ</span>
                            <span className="text-slate-400">
                              ระบุเป็นเดือน
                            </span>
                          </FormLabel>
                            <div className="flex gap-2">
                              {[12, 24, 36].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => field.onChange(m)}
                                  disabled={isReadOnly}
                                  className={`
                                  flex-1 h-11 rounded-lg border text-sm font-medium transition-all
                                  ${
                                    field.value === m
                                      ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                  }
                                `}
                                >
                                  {m >= 12 ? `${m / 12} ปี` : `${m} เดือน`}
                                </button>
                              ))}
                              {/* Custom Input for contract */}
                              <div className="relative w-20">
                                <NumberInput
                                  value={field.value ?? undefined}
                                  onChange={field.onChange}
                                  placeholder="-"
                                  className="h-9 w-full rounded-lg border-slate-200 text-center text-sm font-medium focus:border-orange-600"
                                />
                              </div>
                              <span className="flex items-center text-xs text-slate-400">
                                ด.
                              </span>
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                            </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips Footer */}
          <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-100 flex gap-3 text-slate-600">
            <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold text-slate-800">Tips:</span>{" "}
              การใส่ส่วนลด (ราคาพิเศษ) จะช่วยให้ประกาศของคุณติดป้าย{" "}
              <span className="font-bold text-rose-500">Hot Deal</span>{" "}
              และได้รับการจัดอันดับที่ดีขึ้นในหน้าค้นหา
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===== SPECS & SIZE ===== */}
      <Card className="border-slate-200/70 bg-white">
        <CardHeader className="space-y-4">
          <SectionHeader
            icon={LayoutGrid}
            title="สเปกและขนาด"
            desc="ตัวเลขที่ลูกค้าถามบ่อยที่สุด"
            tone="purple"
          />
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent>
          <div className="flex flex-col lg:flex-row lg:gap-8">
            {/* Specs Zone - Left */}
            <div className="flex-1 space-y-4 pb-6 lg:pb-0 lg:pr-8 lg:border-r lg:border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="h-5 w-1 bg-purple-500 rounded-full" />
                สเปกและสัดส่วน
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
                {[
                  { name: "bedrooms", label: "ห้องนอน", emoji: "🛏️" },
                  { name: "bathrooms", label: "ห้องน้ำ", emoji: "🚿" },
                  { name: "parking_slots", label: "ที่จอดรถ", emoji: "🚗" },
                  { name: "floor", label: "ชั้นที่", emoji: "🏢" },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={item.name as any}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {item.emoji} {item.label}
                        </FormLabel>
                        <FormControl>
                          <NumberInput
                            {...field}
                            placeholder="-"
                            disabled={isReadOnly}
                            className={[
                              "h-9 rounded-lg border-slate-200 bg-white text-center text-sm",
                              "font-medium text-slate-900",
                              "focus:border-slate-900 focus:ring-0",
                              isReadOnly ? "bg-slate-50 text-slate-500" : "",
                              fieldState.error ? "border-rose-400" : "",
                            ].join(" ")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Mobile Separator */}
            <Separator className="bg-slate-200/70 my-6 lg:hidden" />

            {/* Size & Area Zone - Right */}
            <div className="flex-1 space-y-4">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="h-5 w-1 bg-emerald-500 rounded-full" />
                ขนาดและทำเล
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <UnitNumberField
                  label="📐 พื้นที่ใช้สอย"
                  name="size_sqm"
                  control={form.control}
                  placeholder="0"
                  suffix="ตร.ม."
                  disabled={isReadOnly}
                  emphasize
                  size="sm"
                />

                <UnitNumberField
                  label="🏞️ ขนาดที่ดิน"
                  name="land_size_sqwah"
                  control={form.control}
                  placeholder="0"
                  suffix="ตร.ว."
                  disabled={isReadOnly}
                  emphasize
                  size="sm"
                />

                <FormField
                  control={form.control}
                  name="zoning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        🗺️ ผังสี / Zoning
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isReadOnly}
                          value={field.value ?? ""}
                          placeholder="เช่น สีส้ม ย.5-10"
                          className="h-9 rounded-lg border-slate-200 bg-white focus:border-slate-900 focus:ring-0 text-sm font-medium"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== DESCRIPTION + SPECIAL ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200/70 bg-white">
          <CardHeader className="space-y-3">
            <SectionHeader
              icon={FileText}
              title="รายละเอียด"
              desc="เขียนให้ขายง่าย: จุดเด่น, ใกล้อะไร, เฟอร์นิเจอร์, เงื่อนไข"
            />
            <Separator className="bg-slate-200/70" />
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isReadOnly}
                      rows={7}
                      className="resize-y min-h-[350px] rounded-2xl border-slate-200 bg-slate-50/40 p-4 leading-relaxed transition focus:bg-white focus:border-slate-900 focus:ring-0"
                      placeholder={`ตัวอย่าง:\n• จุดเด่น: รีโนเวทใหม่ / วิวโล่ง / ใกล้ BTS\n• เฟอร์นิเจอร์/เครื่องใช้ไฟฟ้า: ...\n• เงื่อนไข: ...`}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    แนะนำใส่ “สิ่งที่ทำให้ต่างจากทรัพย์อื่น” 3–5 ข้อ
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white">
          <CardHeader className="space-y-3">
            <SectionHeader
              icon={PawPrint}
              title="คุณสมบัติพิเศษ"
              desc="ช่วยกรองลูกค้าได้เร็ว"
              right={
                <Badge variant="secondary" className="rounded-full">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Highlight
                </Badge>
              }
            />
            <Separator className="bg-slate-200/70" />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Verified Toggle */}
            <FormField
              control={form.control}
              name="verified"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 transition hover:bg-blue-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Verified Listing
                      </FormLabel>
                      <p className="text-xs text-blue-800/70">
                        เปิดเมื่อตรวจสอบเอกสารสิทธิ์/ทรัพย์จริงแล้ว
                        (เพิ่มความน่าเชื่อถือ)
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Pet Friendly Toggle */}
            <FormField
              control={form.control}
              name="is_pet_friendly"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 transition hover:bg-orange-50/60 cursor-pointer">
                  <div
                    className="flex items-start justify-between gap-3"
                    onClick={() => !isReadOnly && field.onChange(!field.value)}
                  >
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-bold text-orange-900 cursor-pointer">
                        🐶 Pet Friendly
                      </FormLabel>
                      <p className="text-xs text-orange-800/70">
                        เปิดไว้เมื่อโครงการ/เจ้าของอนุญาตเลี้ยงสัตว์
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        className="data-[state=checked]:bg-blue-600"
                        onClick={(e) => e.stopPropagation()} // Prevent double toggle
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* ===== COMMISSION (INTERNAL) ===== */}
      <Card className="border-blue-200/60 bg-gradient-to-b from-blue-50/70 to-white">
        <CardHeader className="space-y-4">
          <SectionHeader
            icon={Percent}
            title="คอมมิชชั่น (Internal Only)"
            desc="ข้อมูลหลังบ้าน ใช้คำนวณผลตอบแทน/ปิดดีล"
            tone="blue"
            right={
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[10px] font-bold text-blue-600 shadow-sm">
                <Lock className="h-3.5 w-3.5" />
                STAFF ONLY
              </span>
            }
          />
          <Separator className="bg-blue-200/60" />
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Commission Sale */}
          {showSale && (
            <FormField
              control={form.control}
              name="commission_sale_percentage"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold text-blue-800">
                    คอมมิชชั่นขาย (%)
                  </FormLabel>

                  <FormControl>
                    <div className="flex items-center">
                      <NumberInput
                        {...field}
                        value={field.value ?? undefined} // ✅ กัน null
                        onChange={(v) => field.onChange(v)} // ✅ ให้ NumberInput ส่ง number|undefined
                        decimals={2}
                        placeholder="3"
                        disabled={isReadOnly}
                        className="h-11 w-full rounded-l-xl rounded-r-none border-r-0 border-blue-200 bg-white font-bold focus:border-slate-900 focus:ring-0"
                      />
                      <span className="h-11 rounded-r-xl border border-l-0 border-blue-200 bg-blue-100 px-3 text-sm font-bold text-blue-700">
                        %
                      </span>
                    </div>
                  </FormControl>

                  <div className="grid grid-cols-3 gap-2">
                    {[3, 4, 5].map((val) => {
                      const active = Number(field.value) === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => field.onChange(val)}
                          className={[
                            "h-10 rounded-xl border text-xs font-bold transition",
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-100 bg-white text-blue-600 hover:bg-blue-50",
                            isReadOnly ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          {val}%
                        </button>
                      );
                    })}
                  </div>

                  <FormDescription className="text-xs text-blue-700/70">
                    เลือก preset เพื่อกรอกเร็ว ลดการพิมพ์
                  </FormDescription>

                  {/* Commission Preview */}
                  <div className="mt-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                      💰 ค่าคอมมิชชั่นที่จะได้รับ:
                      {saleCommissionPreview !== null ? (
                        <span className="text-lg font-extrabold text-emerald-600">
                          {new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                            maximumFractionDigits: 0,
                          }).format(saleCommissionPreview)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500 font-normal">
                          กรอกราคาและ % เพื่อดูตัวอย่าง
                        </span>
                      )}
                    </p>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Commission Rent */}
          {showRent && (
            <FormField
              control={form.control}
              name="commission_rent_months"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold text-blue-800">
                    คอมมิชชั่นเช่า (เดือน)
                  </FormLabel>

                  <FormControl>
                    <div className="flex items-center">
                      <NumberInput
                        {...field}
                        value={field.value ?? undefined} // ✅ กัน null
                        onChange={(v) => field.onChange(v)} // ✅ ให้ NumberInput ส่ง number|undefined
                        decimals={1}
                        placeholder="1"
                        disabled={isReadOnly}
                        className="h-11 w-full rounded-l-xl rounded-r-none border-r-0 border-blue-200 bg-white font-bold focus:border-slate-900 focus:ring-0"
                      />
                      <span className="h-11 rounded-r-xl border border-l-0 border-blue-200 bg-blue-100 px-3 text-sm font-bold text-blue-700">
                        ด.
                      </span>
                    </div>
                  </FormControl>

                  <div className="grid grid-cols-3 gap-2">
                    {[0.5, 1, 1.5].map((val) => {
                      const active = Number(field.value) === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => field.onChange(val)}
                          className={[
                            "h-10 rounded-xl border text-xs font-bold transition",
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-100 bg-white text-blue-600 hover:bg-blue-50",
                            isReadOnly ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          {val} เดือน
                        </button>
                      );
                    })}
                  </div>

                  <FormDescription className="text-xs text-blue-700/70">
                    ค่านิยมทั่วไป: 1 เดือน (ขึ้นกับตลาด/ทำเล)
                  </FormDescription>

                  {/* Commission Preview */}
                  <div className="mt-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                      💰 ค่าคอมมิชชั่นที่จะได้รับ:
                      {rentCommissionPreview !== null ? (
                        <span className="text-lg font-extrabold text-emerald-600">
                          {new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                            maximumFractionDigits: 0,
                          }).format(rentCommissionPreview)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500 font-normal">
                          กรอกค่าเช่าและเดือนเพื่อดูตัวอย่าง
                        </span>
                      )}
                    </p>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
