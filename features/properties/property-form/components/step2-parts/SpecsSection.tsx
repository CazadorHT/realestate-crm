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

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 relative">
          {/* Vertical Divider for Desktop */}
          <div className="hidden lg:block absolute left-1/3 top-0 bottom-0 w-px bg-slate-100 -ml-2" />
          <div className="hidden lg:block absolute right-1/3 top-0 bottom-0 w-px bg-slate-100 -mr-2" />

          {/* Specs Zone - Left */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-medium text-slate-900">
                สเปกและสัดส่วน
              </h4>
            </div>

            <div className="grid grid-cols-4 gap-4">
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
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-600 uppercase tracking-wide">
                        <item.icon className="h-4 w-4 text-slate-400" />
                        {item.label}
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

          {/* Size & Area Zone - Right */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <Maximize2 className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-medium text-slate-900">
                ขนาดและทำเล
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <UnitNumberField
                label={
                  <>
                    <Ruler className="h-4 w-4" /> พื้นที่ใช้สอย
                  </>
                }
                name="size_sqm"
                control={form.control}
                placeholder="0"
                suffix="ตร.ม."
                disabled={isReadOnly}
                emphasize
                size="sm"
              />

              <UnitNumberField
                label={
                  <>
                    <Map className="h-4 w-4" /> ขนาดที่ดิน
                  </>
                }
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
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-600 uppercase tracking-wide">
                      <MapPinned className="h-4 w-4" /> ผังสี / Zoning
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
  );
}
