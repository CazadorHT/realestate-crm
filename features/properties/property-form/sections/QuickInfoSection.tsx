"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import {
  Loader2,
  FileText,
  MapPin,
  Plus,
  Flag,
  Zap,
  X,
  Languages,
  Sparkles,
} from "lucide-react";
import { useAITranslation } from "../hooks/use-ai-translation";

import type { PropertyFormValues } from "@/features/properties/schema";
import { useThaiAddress } from "@/hooks/useThaiAddress";
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
import { translateTextAction } from "@/lib/ai/translation-actions";
import { toast } from "sonner";

type Props = {
  popularAreas: string[];
  isAddingArea: boolean;
  newArea: string;
  setNewAreaAction: (v: string) => void;
  newAreaEn: string;
  setNewAreaEnAction: (v: string) => void;
  newAreaCn: string;
  setNewAreaCnAction: (v: string) => void;
  newAreaRu: string;
  setNewAreaRuAction: (v: string) => void;
  onAddAreaAction: () => void;
};

export function QuickInfoSection({
  popularAreas,
  isAddingArea,
  newArea,
  setNewAreaAction,
  newAreaEn,
  setNewAreaEnAction,
  newAreaCn,
  setNewAreaCnAction,
  newAreaRu,
  setNewAreaRuAction,
  onAddAreaAction,
}: Props) {
  const form = useFormContext<PropertyFormValues>();
  const { provinces, loading: addressLoading } = useThaiAddress();
  const hasTitleError = !!form.formState.errors.title;
  const [showAddArea, setShowAddArea] = React.useState(false);
  const { isTranslating, translateTitle } = useAITranslation(form);
  const [isTranslatingArea, setIsTranslatingArea] = React.useState(false);

  // AI Translation for New Area
  const handleTranslateArea = async () => {
    if (!newArea.trim()) {
      toast.error("กรุณากรอกชื่อย่านภาษาไทยก่อนกดแปลครับ");
      return;
    }
    setIsTranslatingArea(true);
    const toastId = toast.loading(
      "กำลังแปลชื่อย่านเป็นภาษาอังกฤษ จีน และรัสเซีย...",
    );
    try {
      const result = await translateTextAction(newArea, "plain");
      setNewAreaEnAction(result.en);
      setNewAreaCnAction(result.cn);
      setNewAreaRuAction(result.ru);
      toast.success("แปลชื่อย่านเรียบร้อยแล้ว ✨", { id: toastId });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "การแปลขัดข้อง", {
        id: toastId,
      });
    } finally {
      setIsTranslatingArea(false);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Thai Title - Full Width */}
        <div className="md:col-span-2 lg:col-span-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <FormItem data-field="title" className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={field.name}
                    className={`font-medium text-sm uppercase tracking-wider ${
                      fieldState.error ? "text-red-700" : "text-slate-700"
                    }`}
                  >
                    ชื่อทรัพย์ (ไทย) <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => translateTitle()}
                    disabled={isTranslating}
                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 transition-all text-xs"
                  >
                    {isTranslating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    AI แปลเป็น EN/CN/RU
                  </Button>
                </div>

                <FormControl>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={`h-14 rounded-2xl bg-white font-normal text-md pl-12 pr-6 ${
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

        {/* Multi-language Titles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-1 lg:col-span-4">
          {/* Title (English) */}
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <label className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> Title (English)
                </label>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-14 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-md"
                    placeholder="English title..."
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 物业名称 (Chinese) */}
          <FormField
            control={form.control}
            name="title_cn"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <label className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> 物业名称 (Chinese)
                </label>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-14 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-md"
                    placeholder="中文名称..."
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Название (Russian) */}
          <FormField
            control={form.control}
            name="title_ru"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <label className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> Название (Russian)
                </label>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-14 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-md"
                    placeholder="Название..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* province */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-1 lg:col-span-4">
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2">
                <label className="font-medium text-sm uppercase tracking-wider text-slate-700 h-8 flex items-center gap-2">
                  จังหวัด <span className="text-red-500">*</span>
                  {addressLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                </label>
                <div className="mt-auto w-full">
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      // Reset dependent fields when province changes in Step 1
                      form.setValue("district", "");
                      form.setValue("subdistrict", "");
                      form.setValue("postal_code", "");
                      form.setValue("popular_area", undefined);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-2xl bg-white font-medium pl-12 pr-6 py-7 relative w-full border-slate-200">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Flag className="h-5 w-5" />
                        </div>
                        <SelectValue placeholder="เลือกจังหวัด" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[350px] p-2">
                      <SelectGroup>
                        {provinces.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.name_th}
                            className="rounded-lg"
                          >
                            {p.name_th}
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
          {/* popular_area */}
          <FormField
            control={form.control}
            name="popular_area"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2 ">
                <label
                  htmlFor={field.name}
                  className="font-medium text-sm uppercase tracking-wider text-slate-700 h-8"
                >
                  ระบุย่านทำเล
                </label>

                <div className="mt-auto w-full  ">
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? undefined : v)
                    }
                    name={field.name}
                  >
                    <FormControl>
                      <SelectTrigger
                        id={field.name}
                        className="rounded-2xl bg-white font-medium pl-12 pr-6 py-7 relative w-full border-slate-200"
                      >
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
                        {[...(popularAreas || [])].sort((a, b) => a.localeCompare(b, "th")).map((a) => (
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

        {/* เพิ่มย่านใหม่ - Full Width Bottom */}
        <div className="md:col-span-2 lg:col-span-4 flex flex-col">
          <div className="flex-1 flex flex-col justify-end space-y-4 pt-4 border-t border-slate-100">
            {!showAddArea ? (
              <div className="h-10 flex items-center">
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
                  <div className="flex items-center gap-2">
                    <label className="font-medium text-sm uppercase tracking-wider text-slate-700">
                      เพิ่มย่านใหม่ (Multi-language)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleTranslateArea}
                      disabled={isTranslatingArea}
                      className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 transition-all text-[10px]"
                    >
                      {isTranslatingArea ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-amber-500" />
                      )}
                      AI ช่วยแปลชื่อย่าน
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddArea(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Flag className="h-5 w-5" />
                    </div>
                    <Input
                      value={newArea}
                      onChange={(e) => setNewAreaAction(e.target.value)}
                      className="h-14 rounded-2xl bg-white font-medium pl-12 pr-6 w-full"
                      placeholder="ชื่อย่าน (ไทย)"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Languages className="h-5 w-5" />
                    </div>
                    <Input
                      value={newAreaEn}
                      onChange={(e) => setNewAreaEnAction(e.target.value)}
                      className="h-14 rounded-2xl bg-white font-medium pl-12 pr-6 w-full text-blue-600"
                      placeholder="Area (English)"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Languages className="h-5 w-5" />
                    </div>
                    <Input
                      value={newAreaCn}
                      onChange={(e) => setNewAreaCnAction(e.target.value)}
                      className="h-14 rounded-2xl bg-white font-medium pl-12 pr-6 w-full text-indigo-600"
                      placeholder="区域 (Chinese)"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Languages className="h-5 w-5" />
                    </div>
                    <Input
                      value={newAreaRu}
                      onChange={(e) => setNewAreaRuAction(e.target.value)}
                      className="h-14 rounded-2xl bg-white font-medium pl-12 pr-6 w-full text-rose-600"
                      placeholder="Район (Russian)"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      onAddAreaAction();
                    }}
                    disabled={isAddingArea}
                    className="h-14 rounded-2xl font-medium px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 min-w-[150px]"
                  >
                    {isAddingArea ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        เพิ่มย่านใหม่
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
