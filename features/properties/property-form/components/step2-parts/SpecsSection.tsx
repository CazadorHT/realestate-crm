"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Users,
  Sparkles,
  Sofa,
  Utensils,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface SpecsSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  isReadOnly: boolean;
}

export function SpecsSection({
  form: formProp,
  isReadOnly,
}: SpecsSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const bedrooms = form.watch("bedrooms");

  const [useSplitLandSize, setUseSplitLandSize] = useState(false);
  const landSizeSqwah = form.watch("land_size_sqwah");

  const { rai, ngan, sqwah } = useMemo(() => {
    if (!landSizeSqwah) return { rai: 0, ngan: 0, sqwah: 0 };
    const r = Math.floor(landSizeSqwah / 400);
    const rem = landSizeSqwah % 400;
    const n = Math.floor(rem / 100);
    const s = Math.round((rem % 100) * 100) / 100;
    return { rai: r, ngan: n, sqwah: s };
  }, [landSizeSqwah]);

  useEffect(() => {
    if (landSizeSqwah && landSizeSqwah >= 400) {
      setUseSplitLandSize(true);
    }
  }, []);

  const handleSplitChange = (
    type: "rai" | "ngan" | "sqwah",
    value: number | undefined,
  ) => {
    const currentRai = type === "rai" ? (value ?? 0) : rai;
    const currentNgan = type === "ngan" ? (value ?? 0) : ngan;
    const currentSqwah = type === "sqwah" ? (value ?? 0) : sqwah;

    const total = currentRai * 400 + currentNgan * 100 + currentSqwah;
    form.setValue("land_size_sqwah", total || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const isTotalFloors = form.watch("is_total_floors");
  const propertyType = form.watch("property_type");

  useEffect(() => {
    const isDirty = form.getFieldState("is_total_floors").isDirty;
    if (!isDirty) {
      if (propertyType === "CONDO") {
        form.setValue("is_total_floors", false);
      } else if (propertyType && propertyType !== "LAND") {
        form.setValue("is_total_floors", true);
      }
    }
  }, [propertyType]);

  return (
    <Card className="border-slate-200/70 bg-white">
      <CardHeader className="space-y-4">
        <SectionHeader
          icon={LayoutGrid}
          title={isEn ? "Specs & Dimensions" : "สเปกและขนาด"}
          desc={isEn ? "Key property specifications and figures" : "ตัวเลขที่ลูกค้าถามบ่อยที่สุด"}
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
                {isEn ? "Specs & Layout" : "สเปกและสัดส่วน"}
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
              {[
                { name: "bedrooms", label: isEn ? "Bedrooms" : "ห้องนอน", icon: BedDouble },
                { name: "bathrooms", label: isEn ? "Bathrooms" : "ห้องน้ำ", icon: Bath },
                { name: "parking_slots", label: isEn ? "Parking" : "ที่จอดรถ", icon: CarFront },
                { name: "floor", label: isEn ? "Floor" : "ชั้นที่", icon: Building2 },
                {
                  name: "office_capacity",
                  label: isEn ? "Seating Capacity" : "รองรับจำนวนที่นั่ง",
                  icon: Users,
                },
                { name: "maid_rooms", label: isEn ? "Maid Rooms" : "ห้องแม่บ้าน", icon: Sparkles },
                { name: "halls", label: isEn ? "Living Halls" : "ห้องโถงใหญ่", icon: Sofa },
                { name: "dining_rooms", label: isEn ? "Dining Rooms" : "ห้องอาหาร", icon: Utensils },
              ].map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name as any}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider w-full">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <item.icon className="h-4 w-4 text-purple-500 shrink-0" />
                          <span className="truncate">
                            {item.name === "floor"
                              ? isTotalFloors
                                ? (isEn ? "Total Floors" : "จำนวนชั้น")
                                : (isEn ? "Floor" : "ชั้นที่")
                              : item.label}
                          </span>
                        </span>
                        {item.name === "floor" && (
                          <button
                            type="button"
                            onClick={() =>
                              form.setValue("is_total_floors", !isTotalFloors, {
                                shouldDirty: true,
                              })
                            }
                            title={isTotalFloors ? (isEn ? "Switch to Floor No." : "สลับเป็น ชั้นที่") : (isEn ? "Switch to Total Storeys" : "สลับเป็น มีกี่ชั้น")}
                            className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline normal-case font-medium transition-colors cursor-pointer select-none shrink-0"
                          >
                            {isTotalFloors
                              ? (isEn ? "Floor No.?" : "สลับเป็นชั้นที่")
                              : (isEn ? "Total Floors?" : "สลับเป็นมีกี่ชั้น")}
                          </button>
                        )}
                      </FormLabel>
                      <FormControl>
                        {item.name === "office_capacity" ? (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={isEn ? "e.g. 4-5 seats" : "เช่น 4-5"}
                            disabled={isReadOnly}
                            className={[
                              "h-9 rounded-lg border-slate-200 bg-white text-center text-sm",
                              "text-slate-900 focus:border-purple-500 focus:ring-purple-500/20 focus:ring-2",
                              isReadOnly ? "bg-slate-50 text-slate-600" : "",
                              fieldState.error ? "border-rose-400" : "",
                            ].join(" ")}
                          />
                        ) : (
                          <div
                            className={`flex items-center justify-between gap-1 border rounded-lg p-1 bg-white focus-within:border-purple-500 focus-within:ring-purple-500/20 focus-within:ring-2 transition-all ${
                              fieldState.error
                                ? "border-rose-400"
                                : "border-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              disabled={
                                isReadOnly ||
                                !field.value ||
                                Number(field.value) <= 0
                              }
                              onClick={() => {
                                const val = Number(field.value) || 0;
                                if (val > 0) {
                                  field.onChange(val - 1);
                                }
                              }}
                              className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>

                            <NumberInput
                              {...field}
                              placeholder="0"
                              disabled={isReadOnly}
                              className={[
                                "h-7 w-full border-0 bg-transparent text-center text-sm p-0 focus:ring-0 focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0",
                                "text-slate-900",
                                isReadOnly ? "text-slate-600" : "",
                              ].join(" ")}
                            />

                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => {
                                const val = Number(field.value) || 0;
                                field.onChange(val + 1);
                              }}
                              className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </FormControl>
                      {item.name === "bathrooms" &&
                        Number(bedrooms) > 0 &&
                        (Number(field.value) || 0) === 0 && (
                          <div className="mt-1 text-[10px] font-semibold text-amber-600 flex items-center gap-1 animate-in fade-in duration-200">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{isEn ? "Please verify bathrooms count" : "กรุณาตรวจสอบจำนวนห้องน้ำ"}</span>
                          </div>
                        )}
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
                {isEn ? "Dimensions & Area" : "ขนาดและทำเล"}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                
              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <Ruler className="h-4 w-4 text-emerald-500" />
                    <span>{isEn ? "Usable Area" : "พื้นที่ใช้สอย"}</span>
                  </span>
                }
                name="size_sqm"
                control={form.control}
                placeholder={isEn ? "in Sq.m." : "ระบุตารางเมตร"}
                suffix={isEn ? "Sq.m." : "ตร.ม."}
                disabled={isReadOnly}
                emphasize
                size="sm"
                decimals={2}
                className="font-normal "
                labelClassName=" "
              />

              {useSplitLandSize ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <Map className="h-4 w-4 text-emerald-500" />
                      <span>{isEn ? "Land Size (Rai - Ngan - Sq.wah)" : "ขนาดที่ดิน (ไร่ - งาน - ตร.ว.)"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseSplitLandSize(false)}
                      className="text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                    >
                       {isEn ? "Switch to Sq.wah only" : "สลับใช้ ตร.ว. เดี่ยว"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="flex items-center">
                        <NumberInput
                          value={rai || undefined}
                          onChange={(val) => handleSplitChange("rai", val)}
                          disabled={isReadOnly}
                          placeholder="0"
                          className="h-9 w-full rounded-l-lg border border-slate-200 border-r-0 bg-white text-center text-sm font-medium focus:border-emerald-500 focus:ring-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:border-emerald-500"
                        />
                        <span className="h-9 flex items-center bg-slate-50 border border-slate-200 rounded-r-lg px-2 text-[10px] text-slate-500 select-none whitespace-nowrap">
                          {isEn ? "Rai" : "ไร่"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <NumberInput
                          value={ngan || undefined}
                          onChange={(val) => handleSplitChange("ngan", val)}
                          disabled={isReadOnly}
                          placeholder="0"
                          className="h-9 w-full rounded-l-lg border border-slate-200 border-r-0 bg-white text-center text-sm font-medium focus:border-emerald-500 focus:ring-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:border-emerald-500"
                        />
                        <span className="h-9 flex items-center bg-slate-50 border border-slate-200 rounded-r-lg px-2 text-[10px] text-slate-500 select-none whitespace-nowrap">
                          {isEn ? "Ngan" : "งาน"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <NumberInput
                          value={sqwah || undefined}
                          onChange={(val) => handleSplitChange("sqwah", val)}
                          disabled={isReadOnly}
                          decimals={2}
                          placeholder="0"
                          className="h-9 w-full rounded-l-lg border border-slate-200 border-r-0 bg-white text-center text-sm font-medium focus:border-emerald-500 focus:ring-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus-visible:border-emerald-500"
                        />
                        <span className="h-9 flex items-center bg-slate-50 border border-slate-200 rounded-r-lg px-1.5 text-[10px] text-slate-500 select-none whitespace-nowrap">
                          {isEn ? "Sq.w" : "ตร.ว."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <UnitNumberField
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-emerald-500" />
                          <span>{isEn ? "Land Size" : "ขนาดที่ดิน"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUseSplitLandSize(true);
                          }}
                          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                        >
                          {isEn ? "Switch to Rai-Ngan-Sq.w" : "สลับใช้ ไร่-งาน-ตร.ว."}
                        </button>
                      </div>
                    }
                    name="land_size_sqwah"
                    control={form.control}
                    placeholder={isEn ? "in Sq.wah" : "ระบุตารางวา"}
                    suffix={isEn ? "Sq.wah" : "ตร.ว."}
                    disabled={isReadOnly}
                    emphasize
                    size="sm"
                    decimals={2}
                    className="font-normal"
                    labelClassName="w-full flex items-center justify-between text-xs font-medium text-slate-600 uppercase tracking-wider"
                  />
                  {landSizeSqwah && landSizeSqwah >= 400 && (
                    <div
                      onClick={() => setUseSplitLandSize(true)}
                      className="text-[10px] text-emerald-700 bg-emerald-50/50 border border-emerald-100 px-2 py-1 rounded-md cursor-pointer hover:bg-emerald-100/50 transition-colors flex items-center justify-between animate-in fade-in slide-in-from-top-1"
                    >
                      <span>
                        {isEn
                          ? `Total: ${rai} Rai ${ngan} Ngan ${sqwah} Sq.wah`
                          : `คิดเป็น: ${rai} ไร่ ${ngan} งาน ${sqwah} ตร.ว.`}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 underline">
                        {isEn ? "Switch" : "สลับโหมด"}
                      </span>
                    </div>
                  )}
                </div>
              )}
              </div>

              <FormField
                control={form.control}
                name="zoning"
                render={({ field }) => (
                  <FormItem className="col-span-1 sm:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <MapPinned className="h-4 w-4 text-emerald-500" />
                      <span>{isEn ? "Zoning Code" : "ผังสี / Zoning"}</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isReadOnly}
                        value={field.value ?? ""}
                        placeholder={isEn ? "e.g. Orange Yor.5-10" : "เช่น สีส้ม ย.5-10"}
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
                {isEn ? "Utilities & Charges" : "ค่าใช้จ่ายอื่นๆ"}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="electricity_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>{isEn ? "Electricity" : "ค่าไฟ"}</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        placeholder={isEn ? "e.g. 7 THB/unit" : "เช่น 7 บาท/หน่วย"}
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
                      <Droplets className="h-4 w-4 text-amber-500" />
                      <span>{isEn ? "Water Rate" : "ค่าน้ำ"}</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        placeholder={isEn ? "e.g. 20 THB/unit" : "เช่น 20 บาท/หน่วย"}
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
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>{isEn ? "Rent-Free Period" : "ปลอดค่าเช่า"}</span>
                  </span>
                }
                name="rent_free_period_days"
                control={form.control}
                placeholder={isEn ? "Optional" : "โปรดระบุ (ถ้ามี)"}
                suffix={isEn ? "Days" : "วัน"}
                disabled={isReadOnly}
                size="sm"
                className="font-normal "
                labelClassName=" "
                footer={<RentFreeShortcuts isEn={isEn} />}
              />

              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <Car className="h-4 w-4 text-amber-500" />
                    <span>{isEn ? "Extra Parking Fee" : "ค่าจอดรถเสริม"}</span>
                  </span>
                }
                name="parking_fee_additional"
                control={form.control}
                placeholder={isEn ? "Optional" : "โปรดระบุ (ถ้ามี)"}
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
                {isEn ? "Technical Specs" : "สเปกทางเทคนิค"}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <UnitNumberField
                label={
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    <ArrowUpToLine className="h-4 w-4 text-blue-500" />
                    <span>{isEn ? "Ceiling Height" : "ความสูงเพดาน"}</span>
                  </span>
                }
                name="ceiling_height"
                control={form.control}
                placeholder={isEn ? "Specify" : "โปรดระบุ"}
                suffix={isEn ? "m." : "ม."}
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
                      <span>{isEn ? "Parking Type" : "ประเภทที่จอดรถ"}</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
                        {[
                          { value: "COMMON", label: isEn ? "Common" : "หมุนเวียน" },
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
                      <span>{isEn ? "Orientation" : "ทิศทางทรัพย์"}</span>
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

function RentFreeShortcuts({ isEn = false }: { isEn?: boolean }) {
  const { watch, setValue } = useFormContext<PropertyFormValues>();
  const value = watch("rent_free_period_days");

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
              setValue("rent_free_period_days", newValue as any, {
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
            {m} {isEn ? "Mo" : "ด."}
          </button>
        );
      })}
    </div>
  );
}
