"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NumberInput } from "../NumberInput";
import { SectionHeader } from "../SectionHeader";
import { UnitNumberField } from "../UnitNumberField";
import {
  Bath,
  BedDouble,
  Building2,
  CarFront,
  LayoutGrid,
  Map,
  MapPinned,
  Maximize2,
  Ruler,
  ArrowUpToLine,
  ParkingCircle,
  Compass,
  Car,
  Clock,
  Droplets,
  Zap,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";

interface SpecsSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
}

export function SpecsSection({ form, isReadOnly }: SpecsSectionProps) {
  return (
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

      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 relative">
          {/* Vertical Divider for Desktop / Tablet */}
          <div className="hidden lg:block absolute left-1/4 top-0 bottom-0 w-px bg-slate-100 -ml-2" />
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 " />
          <div className="hidden lg:block absolute right-1/4 top-0 bottom-0 w-px bg-slate-100 -mr-2" />

          {/* Specs Zone - 1 (Purple)  */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-widest">
                สเปกและสัดส่วน
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "bedrooms", label: "ห้องนอน", icon: BedDouble },
                { name: "bathrooms", label: "ห้องน้ำ", icon: Bath },
                { name: "parking_slots", label: "ที่จอดรถ", icon: CarFront },
                { name: "floor", label: "ชั้นที่", icon: Building2 },
              ].map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name as any}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                        <item.icon className="h-4 w-4 text-purple-500" />
                        {item.label}
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          {...field}
                          placeholder="ระบุ"
                          disabled={isReadOnly}
                          className={[
                            "h-9 rounded-lg border-slate-200 bg-white text-center text-sm",
                            "text-slate-900",
                            "focus:border-purple-500 focus:ring-purple-500/20 focus:ring-2",
                            isReadOnly ? "bg-slate-50 text-slate-600" : "",
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
          {/* Size & Area Zone - 2 (Emerald) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <Maximize2 className="h-4 w-4 " />
              </div>
              <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">
                ขนาดและทำเล
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <Ruler className="h-4 w-4 text-emerald-500" /> พื้นที่ใช้สอย
                  </span>
                }
                name="size_sqm"
                control={form.control}
                placeholder="ระบุตารางเมตร"
                suffix="ตร.ม."
                disabled={isReadOnly}
                emphasize
                size="sm"
                className="font-normal"
                labelClassName=" "
              />

              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <Map className="h-4 w-4 text-emerald-500" /> ขนาดที่ดิน
                  </span>
                }
                name="land_size_sqwah"
                control={form.control}
                placeholder="ระบุตารางวา"
                suffix="ตร.ว."
                disabled={isReadOnly}
                emphasize
                size="sm"
                className="font-normal"
                labelClassName=" "
              />

              <FormField
                control={form.control}
                name="zoning"
                render={({ field }) => (
                  <FormItem className="col-span-1 sm:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <MapPinned className="h-4 w-4 text-emerald-500" /> ผังสี /
                      Zoning
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isReadOnly}
                        value={field.value ?? ""}
                        placeholder="เช่น สีส้ม ย.5-10"
                        className="h-9 rounded-lg border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-2 text-sm "
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          {/* Commercial & Utility Specs - 3 Amber */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                <Zap className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold text-amber-700 uppercase tracking-widest">
                ค่าใช้จ่ายอื่นๆ
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="electricity_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <Zap className="h-4 w-4 text-amber-500" /> ค่าไฟ
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        placeholder="เช่น 7 บาท/หน่วย"
                        className="h-9 rounded-lg border-slate-200 bg-white focus:border-amber-500 focus:ring-amber-500/20 focus:ring-2 text-sm "
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="water_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <Droplets className="h-4 w-4 text-amber-500" /> ค่าน้ำ
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        placeholder="เช่น 20 บาท/หน่วย"
                        className="h-9 rounded-lg border-slate-200 bg-white focus:border-amber-500 focus:ring-amber-500/20 focus:ring-2 text-sm "
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <Clock className="h-4 w-4 text-amber-500" /> ปลอดค่าเช่า
                  </span>
                }
                name="rent_free_period_days"
                control={form.control}
                placeholder="โปรดระบุ (ถ้ามี)"
                suffix="วัน"
                disabled={isReadOnly}
                size="sm"
                className="font-normal "
                labelClassName=" "
                footer={<RentFreeShortcuts form={form} />}
              />

              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <Car className="h-4 w-4 text-amber-500" /> ค่าจอดรถเสริม
                  </span>
                }
                name="parking_fee_additional"
                control={form.control}
                placeholder="โปรดระบุ (ถ้ามี)"
                suffix="฿"
                disabled={isReadOnly}
                size="sm"
                labelClassName=" "
                className="font-normal"
              />
            </div>
          </div>
          {/* Technical Specs Zone - 4 (Blue) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <ArrowUpToLine className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-widest">
                สเปกทางเทคนิค
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <ArrowUpToLine className="h-4 w-4 text-blue-500" />{" "}
                    ความสูงเพดาน
                  </span>
                }
                name="ceiling_height"
                control={form.control}
                placeholder="โปรดระบุ"
                suffix="ม."
                disabled={isReadOnly}
                size="sm"
                labelClassName=" "
                className="font-normal"
              />

              <FormField
                control={form.control}
                name="parking_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <ParkingCircle className="h-4 w-4 text-blue-500" />
                      ประเภทที่จอดรถ
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
                        {[
                          { value: "COMMON", label: "หมุนเวียน" },
                          { value: "FIXED", label: "Fix" },
                          { value: "AUTO", label: "Auto" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            disabled={isReadOnly}
                            className={`flex-1 px-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                              (field.value || "COMMON") === opt.value
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-slate-600 hover:bg-blue-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orientation"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <Compass className="h-4 w-4 text-blue-500" />
                      ทิศทางทรัพย์
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
                        {["N", "S", "E", "W", "NE", "NW", "SE", "SW"].map(
                          (opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                field.onChange(field.value === opt ? null : opt)
                              }
                              disabled={isReadOnly}
                              className={`px-1 py-2 text-xs font-medium rounded-md transition-all ${
                                field.value === opt
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-blue-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ),
                        )}
                      </div>
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
  );
}

function RentFreeShortcuts({
  form,
}: {
  form: UseFormReturn<PropertyFormValues>;
}) {
  const value = form.watch("rent_free_period_days");

  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((m) => {
        const days = m * 30;
        const isSelected = value === days;
        return (
          <button
            key={m}
            type="button"
            onClick={() => {
              const newValue = isSelected ? null : days;
              form.setValue("rent_free_period_days", newValue as any, {
                shouldDirty: true,
                shouldValidate: false,
              });
            }}
            className={[
              "px-2 py-2 w-full rounded border transition-all shadow-xs text-xs font-medium",
              isSelected
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-slate-500 border-slate-200 hover:border-amber-500 hover:text-amber-600",
            ].join(" ")}
          >
            {m} ด.
          </button>
        );
      })}
    </div>
  );
}
