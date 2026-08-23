"use client";

import React, { useState, useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../SectionHeader";
import { NumberInput } from "../NumberInput";
import { UnitNumberField } from "../UnitNumberField";
import {
  Banknote,
  Info,
  PlusCircleIcon,
  Sparkles,
  TrendingDown,
  Droplets,
  Zap,
  Clock,
  Car,
  ArrowLeftRight,
} from "lucide-react";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import { AvmResultDialog } from "./AvmResultDialog";
import { FaAirbnb } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { parseAirbnbMinContract } from "@/lib/property-utils";

import { useLanguage } from "@/components/providers/LanguageProvider";

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

interface PriceSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  isReadOnly: boolean;
  showSale: boolean;
  showRent: boolean;
}

export function PriceSection({
  form: formProp,
  isReadOnly,
  showSale,
  showRent,
}: PriceSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  // State for showing discount fields
  const [showSaleDiscount, setShowSaleDiscount] = useState(false);
  const [showRentDiscount, setShowRentDiscount] = useState(false);
  const [showCommonFee, setShowCommonFee] = useState(false);
  const [isAvmSaleOpen, setIsAvmSaleOpen] = useState(false);
  const [isAvmRentOpen, setIsAvmRentOpen] = useState(false);

  // Auto-open discount fields ONLY if there's an actual discount
  const saleOriginal = form.watch("original_price");
  const rentOriginal = form.watch("original_rental_price");
  const salePrice = form.watch("price");
  const rentPrice = form.watch("rental_price");
  const maintenanceFee = form.watch("maintenance_fee");
  const propertyType = form.watch("property_type");
  const sizeSqm = form.watch("size_sqm");
  const landSizeSqwah = form.watch("land_size_sqwah");
  const rentPricePerSqm = form.watch("rent_price_per_sqm");
  const allowAirbnb = form.watch("allow_airbnb");

  const activeCount = (showSale ? 1 : 0) + (showRent ? 1 : 0) + (allowAirbnb ? 1 : 0);
  const showHeaders = activeCount > 1;

  let colSpanClass = "col-span-12";
  if (activeCount === 2) {
    colSpanClass = "col-span-12 md:col-span-6";
  } else if (activeCount === 3) {
    colSpanClass = "col-span-12 md:col-span-4";
  }

  // State for price unit toggle
  const [priceUnit, setPriceUnit] = useState<"sqm" | "sqwah">("sqm");

  // Auto-calculate rent price for Office and Land bidirectional
  useEffect(() => {
    if (propertyType === "OFFICE_BUILDING" || propertyType === "LAND") {
      const activeElement = document.activeElement;
      const activeName = activeElement?.getAttribute("name");
      const size = priceUnit === "sqm" ? sizeSqm : landSizeSqwah;

      if (size) {
        if (activeName === "rent_price_per_sqm") {
          if (rentPricePerSqm) {
            const calculated = Math.round(rentPricePerSqm * size);
            if (form.getValues("original_rental_price") !== calculated) {
              form.setValue("original_rental_price", calculated, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        } else if (
          activeName === "original_rental_price" ||
          activeName === "size_sqm" ||
          activeName === "land_size_sqwah"
        ) {
          if (rentOriginal) {
            const calculated = Math.round((rentOriginal / size) * 100) / 100;
            if (form.getValues("rent_price_per_sqm") !== calculated) {
              form.setValue("rent_price_per_sqm", calculated, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        } else {
          // Default fallback (e.g. on mount or when unit switches)
          if (rentPricePerSqm) {
            const calculated = Math.round(rentPricePerSqm * size);
            if (form.getValues("original_rental_price") !== calculated) {
              form.setValue("original_rental_price", calculated, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          } else if (rentOriginal) {
            const calculated = Math.round((rentOriginal / size) * 100) / 100;
            if (form.getValues("rent_price_per_sqm") !== calculated) {
              form.setValue("rent_price_per_sqm", calculated, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        }
      }
    }
  }, [propertyType, sizeSqm, landSizeSqwah, rentPricePerSqm, rentOriginal, priceUnit, form]);

  useEffect(() => {
    // เปิดเฉพาะเมื่อมี original_price และ มากกว่า price (มีส่วนลดจริง)
    if (saleOriginal && salePrice && saleOriginal > salePrice) {
      setShowSaleDiscount(true);
    }
  }, [saleOriginal, salePrice]);

  useEffect(() => {
    // เปิดเฉพาะเมื่อมี original_rental_price และ มากกว่า rental_price (มีส่วนลดจริง)
    if (rentOriginal && rentPrice && rentOriginal > rentPrice) {
      setShowRentDiscount(true);
    }
  }, [rentOriginal, rentPrice]);

  useEffect(() => {
    // Auto open maintenance fee if it has value
    if (maintenanceFee && maintenanceFee > 0) {
      setShowCommonFee(true);
    }
  }, [maintenanceFee]);

  return (
    <Card className="border-slate-200/70 bg-white/80 ">
      <CardHeader className="space-y-4 ">
        <SectionHeader
          icon={Banknote}
          title={isEn ? "Price & Terms" : "ราคาและเงื่อนไข"}
          desc={
            isEn
              ? "Complete the pricing details for accurate ranking and deal matching"
              : "กรอกให้ครบเพื่อให้ระบบจัดอันดับและแสดงดีลได้แม่นยำ"
          }
          tone="blue"
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 lg:gap-10 relative">
          {/* Vertical Separators for Multi Mode (Large Screens) */}
          {activeCount === 2 && (
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100" />
          )}
          {activeCount === 3 && (
            <>
              <div className="hidden md:block absolute left-1/3 top-0 bottom-0 w-px bg-slate-100" />
              <div className="hidden md:block absolute left-2/3 top-0 bottom-0 w-px bg-slate-100" />
            </>
          )}

          {/* ================= SALE ZONE ================= */}
          {showSale && (
            <div className={`${colSpanClass} space-y-6`}>
              {/* Header for Multi Mode */}
              {showHeaders && (
                <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-900">
                    {isEn ? "Sale Pricing" : "ข้อมูลการขาย (For Sale)"}
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
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{isEn ? "Verify Price" : "ตรวจสอบราคา"}</p>
                        <p className="text-xs opacity-90">
                          {isEn ? "Original price must be higher than discounted price" : "ราคาเต็มต้องมากกว่าราคาพิเศษ"}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Main Price Field */}
                <UnitNumberField
                  label={
                    showSaleDiscount
                      ? (isEn ? "Original Price (Before Discount)" : "ราคาเต็ม (ก่อนลด)")
                      : (isEn ? "Net Selling Price" : "ราคาขายสุทธิ")
                  }
                  name="original_price"
                  control={form.control}
                  placeholder={isEn ? "Enter original price" : "กรุณากรอกราคาเต็ม"}
                  suffix="฿"
                  disabled={isReadOnly}
                  emphasize={!showSaleDiscount} // Emphasize if it's the only price
                  required
                  size="default"
                  labelClassName="mb-2"
                  className={
                    showSaleDiscount
                      ? "text-slate-500 bg-slate-50/50"
                      : "text-sm font-medium "
                  }
                />

                {/* AI Evaluate Button for Sale */}
                {!isReadOnly && (
                  <button
                    id="tour-property-ai-price"
                    type="button"
                    onClick={() => setIsAvmSaleOpen(true)}
                    className="flex w-fit items-center gap-2 px-3 py-1.5 mt-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer hover:shadow-md"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isEn ? "AI Price Valuation" : "ประเมินราคาด้วย AI"}</span>
                  </button>
                )}

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
                      <span>{isEn ? "Add Special Price / Discount" : "เพิ่มราคาพิเศษ / ส่วนลด"}</span>
                    </button>
                  </CollapsibleSection>

                  <CollapsibleSection open={showSaleDiscount}>
                    <div className="border-l-2 border-blue-100 pl-4 py-1 space-y-4">
                      <UnitNumberField
                        label={isEn ? "Special Price (Display on Website)" : "ราคาพิเศษ (โชว์หน้าเว็บ)"}
                        name="price"
                        control={form.control}
                        placeholder={isEn ? "Enter special price" : "กรุณากรอกราคาพิเศษ"}
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
                              form.setValue("price", null, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
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
                            <span>{isEn ? "Cancel Discount" : "ยกเลิกส่วนลด"}</span>
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
                      <span>{isEn ? "Add Maintenance Fee (Optional)" : "เพิ่มค่าส่วนกลาง (ถ้ามี)"}</span>
                    </button>
                  </CollapsibleSection>

                  <CollapsibleSection open={showCommonFee}>
                    <div className="border-l-2 border-slate-100 pl-4 py-2">
                      <UnitNumberField
                        label={isEn ? "Maintenance Fee (Per Year)" : "ค่าส่วนกลาง (ต่อปี)"}
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
                              form.setValue("maintenance_fee", null, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
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
                            <span>{isEn ? "Cancel Fee" : "ยกเลิกค่าส่วนกลาง"}</span>
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
            <div className={`${colSpanClass} space-y-6`}>
              {/* Header for Multi Mode */}
              {showHeaders && (
                <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-900">
                    {isEn ? "Rental Pricing" : "ข้อมูลการเช่า (For Rent)"}
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
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{isEn ? "Verify Price" : "ตรวจสอบราคา"}</p>
                        <p className="text-xs opacity-90">
                          {isEn ? "Original price must be higher than discounted price" : "ราคาเต็มต้องมากกว่าราคาพิเศษ"}
                        </p>
                      </div>
                    </div>
                  )}

                <div
                  className={
                    propertyType === "OFFICE_BUILDING" ||
                    propertyType === "LAND"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-6"
                  }
                >
                  {/* Price per Unit (Only for Office/Land) */}
                  {(propertyType === "OFFICE_BUILDING" ||
                    propertyType === "LAND") && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <UnitNumberField
                        label={
                          <div
                            className="flex items-center gap-2 group cursor-pointer select-none"
                            onClick={() =>
                              setPriceUnit((prev) =>
                                prev === "sqm" ? "sqwah" : "sqm",
                              )
                            }
                            title={isEn ? "Click to switch unit" : "คลิกเพื่อสลับหน่วย"}
                          >
                            <span className="hover:text-blue-600 transition-colors">
                              {isEn ? "Rental Rate per " : "ราคาเช่า ต่อ "}
                              {priceUnit === "sqm"
                                ? (isEn ? "Sq.m." : "ตร.ม.")
                                : (isEn ? "Sq.wah" : "ตร.ว.")}
                            </span>
                            <div className="p-1 rounded-md bg-blue-50 text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-200 group-active:scale-90 shadow-sm border border-blue-100/50">
                              <ArrowLeftRight
                                className={`h-3.5 w-3.5 transition-transform duration-500 ease-in-out ${
                                  priceUnit === "sqwah"
                                    ? "rotate-180"
                                    : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>
                        }
                        name="rent_price_per_sqm"
                        control={form.control}
                        placeholder="0"
                        suffix={
                          priceUnit === "sqm"
                            ? (isEn ? "฿ / Sq.m." : "฿ / ตร.ม.")
                            : (isEn ? "฿ / Sq.wah" : "฿ / ตร.ว.")
                        }
                        disabled={isReadOnly}
                        size="default"
                        className="text-sm font-medium  text-slate-700 border-blue-100 focus:border-blue-300"
                      />
                    </div>
                  )}

                  {/* Main Rent Price */}
                  <UnitNumberField
                    label={
                      showRentDiscount
                        ? (isEn ? "Original Rent (Before Discount)" : "ค่าเช่าเต็ม (ก่อนลด)")
                        : (isEn ? "Monthly Rental Price" : "ค่าเช่าต่อเดือน")
                    }
                    name="original_rental_price"
                    control={form.control}
                    placeholder={
                      propertyType === "OFFICE_BUILDING" ||
                      propertyType === "LAND"
                        ? (isEn ? "Auto-calculated when rate/sq.m. is entered" : "คำนวณอัตโนมัติเมื่อกรอก ราคาต่อ ตร.ม.")
                        : "0"
                    }
                    suffix="฿"
                    disabled={isReadOnly}
                    emphasize={!showRentDiscount}
                    required
                    size="default"
                    className={
                      showRentDiscount
                        ? "text-slate-500 bg-slate-50/50"
                        : "text-sm font-medium"
                    }
                  />

                  {/* AI Evaluate Button for Rent */}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setIsAvmRentOpen(true)}
                      className="flex w-fit items-center gap-2 px-3 py-1.5 mt-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer hover:shadow-md"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isEn ? "AI Rent Valuation" : "ประเมินค่าเช่าด้วย AI"}</span>
                    </button>
                  )}
                </div>

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
                      <span>{isEn ? "Add Promotional Rent" : "เพิ่มราคาโปรโมชั่น"}</span>
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
                            <Info className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">{isEn ? "Verify Price" : "ตรวจสอบราคา"}</p>
                              <p className="text-xs opacity-90">
                                {isEn ? "Original price must be higher than discounted price" : "ราคาเต็มต้องมากกว่าราคาพิเศษ"}
                              </p>
                            </div>
                          </div>
                        )}

                      <UnitNumberField
                        label={isEn ? "Special Rent (Display on Website)" : "ค่าเช่าพิเศษ (โชว์หน้าเว็บ)"}
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
                              form.setValue("rental_price", null, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
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
                            <span>{isEn ? "Cancel Promo" : "ยกเลิกโปรโมชั่น"}</span>
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
                            <span>{isEn ? "Minimum Contract" : "สัญญาขั้นต่ำ"}</span>
                            <span className="text-slate-400">
                              {isEn ? "in months" : "ระบุเป็นเดือน"}
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
                                flex-1 h-11 rounded-lg border text-sm font-medium transition-all gap-2
                                ${
                                  field.value === m
                                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }
                              `}
                              >
                                {isEn
                                  ? (m >= 12 ? `${m / 12} Year${m > 12 ? "s" : ""}` : `${m} Mo`)
                                  : (m >= 12 ? `${m / 12} ปี` : `${m} เดือน`)}
                              </button>
                            ))}
                            {/* Custom Input for contract */}
                            <div className="relative w-20">
                              <NumberInput
                                value={field.value ?? undefined}
                                onChange={field.onChange}
                                placeholder="-"
                                className="h-11 w-full rounded-lg border-slate-200 text-center text-sm font-medium "
                              />
                            </div>
                            <span className="flex items-center text-xs text-slate-400">
                              {isEn ? "mo." : "ด."}
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

          {/* ================= AIRBNB PRICE ZONE ================= */}
          {allowAirbnb && (
            <div className={`${colSpanClass} space-y-6 animate-in fade-in slide-in-from-top-2 duration-300`}>
              {showHeaders && (
                <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
                  <div className="p-1.5 rounded-lg bg-[#FF5A5F]/10 text-[#FF5A5F]">
                    <FaAirbnb className="h-4 w-4 text-[#FF5A5F]" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-900">
                    {isEn ? "Airbnb Pricing" : "ข้อมูลราคา Airbnb (Airbnb Pricing)"}
                  </h4>
                </div>
              )}

              <div className="space-y-6">
                <UnitNumberField
                  label={isEn ? "Airbnb Daily Rate" : "ราคาปล่อยเช่ารายวัน (Airbnb Daily Rate)"}
                  name="airbnb_daily_price"
                  control={form.control}
                  placeholder={isEn ? "Enter daily rate" : "กรุณากรอกราคาปล่อยเช่ารายวัน"}
                  suffix={isEn ? "฿ / Day" : "฿ / วัน"}
                  disabled={isReadOnly}
                  size="default"
                  className="text-sm font-medium text-slate-700"
                />

                <UnitNumberField
                  label={isEn ? "Airbnb Monthly Rate" : "ราคาปล่อยเช่ารายเดือน (Airbnb Monthly Rate)"}
                  name="airbnb_monthly_price"
                  control={form.control}
                  placeholder={isEn ? "Enter monthly rate" : "กรุณากรอกราคาปล่อยเช่ารายเดือน"}
                  suffix={isEn ? "฿ / Month" : "฿ / เดือน"}
                  disabled={isReadOnly}
                  size="default"
                  className="text-sm font-medium text-slate-700"
                />

                <FormField
                  control={form.control}
                  name="airbnb_min_contract"
                  render={({ field }) => {
                    const { number, unit } = parseAirbnbMinContract(field.value);

                    const handleNumberChange = (num: string) => {
                      const cleanNum = num.replace(/\D/g, ""); // digits only
                      if (!cleanNum) {
                        field.onChange("");
                      } else {
                        field.onChange(`${cleanNum} ${unit}`);
                      }
                    };

                    const handleUnitChange = (newUnit: string) => {
                      const finalNum = number || "1";
                      field.onChange(`${finalNum} ${newUnit}`);
                    };

                    return (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                          {isEn ? "Airbnb Minimum Stay" : "สัญญาขั้นต่ำ (Airbnb Minimum Contract)"}
                        </FormLabel>
                        <div className="flex flex-col gap-2.5">
                          {/* Quick Presets */}
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: isEn ? "1 Day" : "1 วัน", value: "1 day" },
                              { label: isEn ? "1 Week" : "1 สัปดาห์", value: "1 week" },
                              { label: isEn ? "1 Month" : "1 เดือน", value: "1 month" },
                              { label: isEn ? "6 Months" : "6 เดือน", value: "6 month" },
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => field.onChange(preset.value)}
                                disabled={isReadOnly}
                                className={`
                                  flex-1 px-3 h-11 rounded-lg border text-sm font-medium transition-all min-w-[75px]
                                  ${
                                    field.value === preset.value
                                      ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                  }
                                `}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {/* Custom input with dropdown selector */}
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={number}
                                onChange={(e) => handleNumberChange(e.target.value)}
                                placeholder={isEn ? "or enter number e.g. 3, 5" : "หรือระบุตัวเลข เช่น 3, 5"}
                                disabled={isReadOnly}
                                className="h-11 rounded-lg border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus-visible:ring-orange-500"
                              />
                            </div>
                            <div className="w-32">
                              <select
                                value={unit}
                                onChange={(e) => handleUnitChange(e.target.value)}
                                disabled={isReadOnly}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus-visible:ring-orange-500 outline-none"
                              >
                                <option value="day">{isEn ? "Days" : "วัน (Days)"}</option>
                                <option value="week">{isEn ? "Weeks" : "สัปดาห์ (Weeks)"}</option>
                                <option value="month">{isEn ? "Months" : "เดือน (Months)"}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tips Footer */}
        <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-100 flex gap-3 text-slate-600">
          <Sparkles className="h-5 w-5 text-yellow-500 shrink-0" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-slate-800">Tips:</span>{" "}
            {isEn ? (
              <>
                Adding discounts / special rates helps your listing earn the{" "}
                <span className="font-bold text-rose-500">Hot Deal</span> badge
                and improves search ranking.
              </>
            ) : (
              <>
                การใส่ส่วนลด (ราคาพิเศษ) จะช่วยให้ประกาศของคุณติดป้าย{" "}
                <span className="font-bold text-rose-500">Hot Deal</span>{" "}
                และได้รับการจัดอันดับที่ดีขึ้นในหน้าค้นหา
              </>
            )}
          </p>
        </div>
      </CardContent>

      {/* AVM Result Dialogs */}
      <AvmResultDialog
        isOpen={isAvmSaleOpen}
        onClose={() => setIsAvmSaleOpen(false)}
        listingType="SALE"
      />
      <AvmResultDialog
        isOpen={isAvmRentOpen}
        onClose={() => setIsAvmRentOpen(false)}
        listingType="RENT"
      />
    </Card>
  );
}
