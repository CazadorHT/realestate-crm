"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2, FileText, MapPin, Plus, Flag, Zap, X } from "lucide-react";

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
  const [showAddArea, setShowAddArea] = React.useState(false);

  return (
    <div
      className={`animate-in fade-in slide-in-from-top-4 duration-500 bg-linear-to-br from-white via-blue-50/50 to-indigo-50/50 p-6 md:p-8 rounded-2xl border space-y-6 ${
        hasTitleError
          ? "border-red-200 bg-red-50/30"
          : "border-blue-100/50 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600 fill-blue-600" />
          </div>
          <div>
            <h3
              className={`text-xl font-medium ${
                hasTitleError ? "text-red-700" : "text-slate-900"
              }`}
            >
              ข้อมูลพื้นฐานของทรัพย์
            </h3>
            <p className="text-slate-500 font-light text-sm mt-0.5">
              ระบุชื่อและย่านเพื่อความสะดวกในการจัดการข้อมูล
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="space-y-6 md:col-span-2">
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
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={`h-14 rounded-2xl bg-white font-medium pl-12 pr-6 ${
                        fieldState.error
                          ? "border-red-300 focus-visible:ring-red-300!"
                          : "border-slate-200 focus-visible:ring-blue-200!"
                      }`}
                      placeholder="เช่น Ideo Sukhumvit 93 ห้องมุม ห้องสวย แต่งครบ"
                    />
                  </div>
                </FormControl>

                <FormMessage className="text-red-600 font-bold" />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-6 md:col-span-1 ">
          {/* popular_area (ผูกกับ RHF ตรง ๆ) */}
          <FormField
            control={form.control}
            name="popular_area"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2 ">
                <label className="font-medium text-sm uppercase tracking-wider text-slate-700">
                  ระบุย่านทำเล
                </label>

                <div className="mt-auto w-full  ">
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? undefined : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-2xl bg-white font-medium pl-12 pr-6 py-7 relative w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <SelectValue placeholder="เลือกย่าน / ทำเล" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[300px] p-4 min-w-(--radix-select-trigger-width)">
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
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-6 md:col-span-2 flex flex-col">
          {/* เพิ่มย่านใหม่ */}
          <div className="flex-1 flex flex-col justify-end space-y-2">
            {!showAddArea ? (
              <div className="h-14 flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddArea(true)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-0 hover:px-4 transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ไม่พบย่านที่ต้องการ? เพิ่มใหม่
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between ">
                  <label className="font-medium text-sm uppercase tracking-wider text-slate-700">
                    เพิ่มย่านใหม่
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddArea(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-3 mt-auto animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Flag className="h-5 w-5" />
                    </div>
                    <Input
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      className="h-14 rounded-2xl bg-white font-medium pl-12 pr-6 w-full"
                      placeholder="เช่น อโศก / ทองหล่อ"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      onAddArea();
                      // Optional: close after add? Keep open for now in case of error/retry
                    }}
                    disabled={isAddingArea}
                    className="h-14 rounded-2xl font-medium px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 min-w-[120px]"
                  >
                    {isAddingArea ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        เพิ่ม
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
