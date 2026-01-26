"use client";

import React, { useMemo } from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NumberInput } from "../NumberInput";
import { SectionHeader } from "../SectionHeader";
import { Banknote, Clock, Coins, Lock, Percent } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";

interface CommissionSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
  showSale: boolean;
  showRent: boolean;
}

export function CommissionSection({
  form,
  isReadOnly,
  showSale,
  showRent,
}: CommissionSectionProps) {
  // Watch values for calculation
  const saleOriginal = form.watch("original_price");
  const salePrice = form.watch("price");
  const rentOriginal = form.watch("original_rental_price");
  const rentPrice = form.watch("rental_price");
  const commissionSalePercent = form.watch("commission_sale_percentage");
  const commissionRentMonths = form.watch("commission_rent_months");

  // Calculations
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

  if (!showSale && !showRent) return null;

  return (
    <Card className="border-blue-200 shadow-sm bg-gradient-to-br from-blue-50/50 via-white to-blue-50/20">
      <CardHeader className="pb-4 border-b border-blue-100">
        <SectionHeader
          icon={Percent}
          title="คอมมิชชั่น (Internal Only)"
          desc="ข้อมูลสำหรับคำนวณผลตอบแทนทีมขาย (ไม่แสดงหน้าเว็บ)"
          tone="blue"
          right={
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700 gap-1.5 px-3 py-1"
            >
              <Lock className="h-3 w-3" />
              STAFF ONLY
            </Badge>
          }
        />
      </CardHeader>

      <CardContent className="pt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Commission Sale */}
        {showSale && (
          <div className="space-y-4 relative group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900">คอมมิชชั่นการขาย</h4>
                <p className="text-xs text-slate-500">คิดเป็น % ของราคาขาย</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <div className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="commission_sale_percentage"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Buttons First */}
                        {[3, 4, 5].map((val) => {
                          const active = Number(field.value) === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => field.onChange(val)}
                              className={`
                                h-10 px-4 rounded-xl text-sm font-medium border transition-all
                                ${
                                  active
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                }
                              `}
                            >
                              {val}%
                            </button>
                          );
                        })}

                        {/* Input Last */}
                        <FormControl>
                          <div className="relative w-28">
                            <NumberInput
                              {...field}
                              value={field.value ?? undefined}
                              onChange={(v) => field.onChange(v)}
                              decimals={2}
                              placeholder="0"
                              disabled={isReadOnly}
                              className="pl-3 pr-8 h-10 text-center font-medium text-emerald-700 border-slate-200 focus:border-emerald-500 focus:ring-0 rounded-xl bg-slate-50"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                              %
                            </div>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              <div className="px-4 py-3 border-t border-emerald-100 flex justify-between items-center bg-emerald-50">
                <span className="text-xs font-medium text-emerald-700">
                  รับจริงประมาณ
                </span>
                {saleCommissionPreview !== null ? (
                  <span className="text-base font-bold text-emerald-600 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-500" />
                    {new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: "THB",
                      maximumFractionDigits: 0,
                    }).format(saleCommissionPreview)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Commission Rent */}
        {showRent && (
          <div className="space-y-4 relative group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900">
                  คอมมิชชั่นการเช่า
                </h4>
                <p className="text-xs text-slate-500">จำนวนเดือนจากค่าเช่า</p>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <div className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="commission_rent_months"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Buttons First */}
                        {[0.5, 1, 1.5].map((val) => {
                          const active = Number(field.value) === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => field.onChange(val)}
                              className={`
                                h-10 px-4 rounded-xl text-sm font-medium border transition-all
                                ${
                                  active
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                                }
                              `}
                            >
                              {val} ด.
                            </button>
                          );
                        })}

                        {/* Input Last */}
                        <FormControl>
                          <div className="relative w-28">
                            <NumberInput
                              {...field}
                              value={field.value ?? undefined}
                              onChange={(v) => field.onChange(v)}
                              decimals={1}
                              placeholder="0"
                              disabled={isReadOnly}
                              className="pl-3 pr-10 h-10 text-center font-medium text-indigo-700 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-xl bg-slate-50"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                              เดือน
                            </div>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              <div className="px-4 py-3 border-t border-indigo-100 flex justify-between items-center bg-indigo-50">
                <span className="text-xs font-medium text-indigo-700">
                  รับจริงประมาณ
                </span>
                {rentCommissionPreview !== null ? (
                  <span className="text-base font-bold text-indigo-600 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-indigo-500" />
                    {new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: "THB",
                      maximumFractionDigits: 0,
                    }).format(rentCommissionPreview)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
