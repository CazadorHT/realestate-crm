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
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";

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
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
  showSale: boolean;
  showRent: boolean;
}

export function PriceSection({
  form,
  isReadOnly,
  showSale,
  showRent,
}: PriceSectionProps) {
  // State for showing discount fields
  const [showSaleDiscount, setShowSaleDiscount] = useState(false);
  const [showRentDiscount, setShowRentDiscount] = useState(false);
  const [showCommonFee, setShowCommonFee] = useState(false);

  // Auto-open discount fields ONLY if there's an actual discount
  const saleOriginal = form.watch("original_price");
  const rentOriginal = form.watch("original_rental_price");
  const salePrice = form.watch("price");
  const rentPrice = form.watch("rental_price");
  const maintenanceFee = form.watch("maintenance_fee");

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
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
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
                  <h4 className="text-sm font-medium text-slate-900">
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
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
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
                            <Info className="h-5 w-5 shrink-0 mt-0.5" />
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
                                className="h-11 w-full rounded-lg border-slate-200 text-center text-sm font-medium "
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
          <Sparkles className="h-5 w-5 text-yellow-500 shrink-0" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-slate-800">Tips:</span>{" "}
            การใส่ส่วนลด (ราคาพิเศษ) จะช่วยให้ประกาศของคุณติดป้าย{" "}
            <span className="font-bold text-rose-500">Hot Deal</span>{" "}
            และได้รับการจัดอันดับที่ดีขึ้นในหน้าค้นหา
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
