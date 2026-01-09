"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

import type { PropertyFormValues } from "@/features/properties/schema"; // ปรับตามจริง
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Props = {
  form: UseFormReturn<PropertyFormValues>;
  popularAreas: string[];
  isAddingArea: boolean;
  newArea: string;
  setNewArea: (v: string) => void;
  onAddArea: () => void;
};

export function QuickInfoSection({
  form,
  popularAreas,
  isAddingArea,
  newArea,
  setNewArea,
  onAddArea,
}: Props) {
  const hasTitleError = !!form.formState.errors.title;

  return (
    <div
      className={`animate-in fade-in slide-in-from-top-4 duration-500 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border-2 space-y-6   ${
        hasTitleError ? "border-red-200 bg-red-50/30" : "border-blue-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-xl ${
              hasTitleError ? "text-red-700" : "text-slate-900"
            }`}
          >
            ข้อมูลพื้นฐานของทรัพย์
          </h3>
          <p className="text-slate-500 font-light text-sm mt-1">
            ระบุชื่อและย่านเพื่อความสะดวกในการจัดการข้อมูล
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* title (ผูกกับ RHF ตรง ๆ) */}
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem data-field="title" className="space-y-2">
              <label
                className={`font-medium text-sm uppercase tracking-wider ${
                  fieldState.error ? "text-red-700" : "text-slate-700"
                }`}
              >
                ชื่อทรัพย์ <span className="text-red-500">*</span>
              </label>

              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={`h-14 rounded-2xl bg-white font-medium px-6 ${
                    fieldState.error
                      ? "border-red-300 focus-visible:!ring-red-300"
                      : "border-slate-200 focus-visible:!ring-blue-200"
                  }`}
                  placeholder="เช่น Ideo Sukhumvit 93 ห้องมุม ห้องสวย แต่งครบ"
                />
              </FormControl>

              <FormMessage className="text-red-600 font-bold" />
            </FormItem>
          )}
        />

        {/* popular_area (ผูกกับ RHF ตรง ๆ) */}
        <FormField
          control={form.control}
          name="popular_area"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <label className="font-medium text-sm uppercase tracking-wider text-slate-700">
                ระบุย่านทำเล (Smart Match)
              </label>

              <Select
                value={field.value ?? "none"}
                onValueChange={(v) =>
                  field.onChange(v === "none" ? undefined : v)
                }
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white font-medium px-6">
                  <SelectValue placeholder="เลือกย่าน / ทำเล" />
                </SelectTrigger>

                <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[300px]">
                  <SelectGroup>
                    <SelectItem
                      value="none"
                      className="font-medium text-slate-400"
                    >
                      -- ไม่ระบุ --
                    </SelectItem>
                    {popularAreas.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* เพิ่มย่านใหม่ */}
        <div className="space-y-2">
          <label className="font-medium text-sm uppercase tracking-wider text-slate-700">
            เพิ่มย่านใหม่
          </label>

          <div className="flex gap-3">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              className="h-14 rounded-2xl bg-white font-medium px-6"
              placeholder="เช่น อโศก / ทองหล่อ / บางนา"
            />
            <Button
              type="button"
              onClick={onAddArea}
              disabled={isAddingArea}
              className="h-14 rounded-2xl font-medium px-6"
            >
              {isAddingArea ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "เพิ่มย่าน"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
