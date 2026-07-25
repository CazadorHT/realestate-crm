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
  Check,
  Search,
} from "lucide-react";
import { useAITranslation } from "../hooks/use-ai-translation";

import type { PropertyFormValues } from "@/features/properties/schema";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  onAddAreaAction: () => Promise<boolean | void> | void;
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
  const [provinceOpen, setProvinceOpen] = React.useState(false);
  const [areaOpen, setAreaOpen] = React.useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState(false);

  const [areaSearchQuery, setAreaSearchQuery] = React.useState("");
  const [desktopAreaOpen, setDesktopAreaOpen] = React.useState(false);
  const [highlightedAreaIndex, setHighlightedAreaIndex] = React.useState(0);

  React.useEffect(() => {
    if (!areaOpen) {
      setAreaSearchQuery("");
    }
  }, [areaOpen]);

  React.useEffect(() => {
    if (!desktopAreaOpen) {
      setAreaSearchQuery("");
    }
  }, [desktopAreaOpen]);

  const sortedFilteredAreas = React.useMemo(() => {
    const query = areaSearchQuery.trim().toLowerCase();
    const list = !query
      ? popularAreas || []
      : (popularAreas || []).filter((a) => a.toLowerCase().includes(query));
    return [...list].sort((a, b) => a.localeCompare(b, "th"));
  }, [popularAreas, areaSearchQuery]);

  React.useEffect(() => {
    setHighlightedAreaIndex(0);
  }, [sortedFilteredAreas]);

  // Scroll active item into view
  React.useEffect(() => {
    const activeEl = document.querySelector('[data-highlighted="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedAreaIndex]);

  const handleAreaKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: any,
    isMobile: boolean
  ) => {
    const totalItems = sortedFilteredAreas.length + 1; // +1 for -- ไม่ระบุ --

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedAreaIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedAreaIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedAreaIndex === 0) {
        field.onChange(undefined);
      } else {
        const selectedArea = sortedFilteredAreas[highlightedAreaIndex - 1];
        if (selectedArea) {
          field.onChange(selectedArea);
        }
      }
      if (isMobile) {
        setAreaOpen(false);
      } else {
        setDesktopAreaOpen(false);
      }
    }
  };

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1535px)");
    const onChange = () => setIsMobileOrTablet(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // AI Translation for New Area & SEO Generation
  const handleTranslateArea = async () => {
    if (!newArea.trim()) {
      toast.error("กรุณากรอกชื่อย่านภาษาไทยก่อนกดแปลครับ");
      return;
    }
    setIsTranslatingArea(true);
    const toastId = toast.loading(
      "กำลังแปลชื่อย่านและเตรียมข้อมูล SEO 4 ภาษาด้วย AI...",
    );
    try {
      const { generateAreaSeoContentAction } = await import(
        "@/features/admin/popular-areas-actions"
      );
      const province = form.getValues("province") || "กรุงเทพมหานคร";
      const aiRes = await generateAreaSeoContentAction(
        newArea.trim(),
        newAreaEn.trim() || newArea.trim(),
        province,
      );
      if (aiRes.success && aiRes.data) {
        const d = aiRes.data;
        if (d.name?.en) setNewAreaEnAction(d.name.en);
        if (d.name?.cn) setNewAreaCnAction(d.name.cn);
        if (d.name?.ru) setNewAreaRuAction(d.name.ru);
        toast.success("แปลชื่อย่านและสร้างข้อมูลทำเล 4 ภาษาเรียบร้อยแล้ว ✨", {
          id: toastId,
        });
      } else {
        const result = await translateTextAction(newArea, "plain");
        setNewAreaEnAction(result.en);
        setNewAreaCnAction(result.cn);
        setNewAreaRuAction(result.ru);
        toast.success("แปลชื่อย่านเรียบร้อยแล้ว ✨", { id: toastId });
      }
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
      className={`animate-in fade-in slide-in-from-top-4 duration-500 bg-linear-to-br from-white via-blue-50/50 to-indigo-50/50 p-4 sm:p-6 md:p-8 rounded-2xl border space-y-6 ${
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
        {/* Multi-language Titles Grid (2x2 Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 lg:col-span-4">
          {/* Main Thai Title */}
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
                    variant="outline"
                    size="sm"
                    onClick={() => translateTitle()}
                    disabled={isTranslating}
                    className="h-8 text-blue-700 bg-blue-50/50 border-blue-200/80 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent hover:shadow-md hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] gap-1.5 transition-all duration-300 text-sm font-semibold rounded-lg px-3 group"
                  >
                    {isTranslating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                    )}
                    AI แปล
                  </Button>
                </div>

                <FormControl>
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={2}
                      className={`min-h-[80px] rounded-2xl bg-white font-normal text-md pl-12 pr-6 py-3.5 resize-none ${
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

          {/* Title (English) */}
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <label className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 h-8">
                  <Languages className="w-3 h-3" /> Title (English)
                </label>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={2}
                    className="min-h-[80px] py-3.5 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-md resize-none"
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
                <label className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 h-8">
                  <Languages className="w-3 h-3" /> 物业名称 (Chinese)
                </label>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={2}
                    className="min-h-[80px] py-3.5 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-md resize-none"
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
                <label className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 h-8">
                  <Languages className="w-3 h-3" /> Название (Russian)
                </label>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={2}
                    className="min-h-[80px] py-3.5 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-md resize-none"
                    placeholder="Название..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* province */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:col-span-2 lg:col-span-4">
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
                  {isMobileOrTablet ? (
                    <ResponsiveDialog
                      open={provinceOpen}
                      onOpenChange={setProvinceOpen}
                      title="เลือกจังหวัด"
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className="group rounded-2xl bg-white font-medium px-4 py-7 relative w-full border-slate-200 justify-start h-14 flex items-center gap-3 hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                        >
                          <Flag className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                          <span className={cn("font-medium transition-colors", field.value ? "text-slate-800 group-hover:text-slate-900" : "text-slate-400 group-hover:text-slate-500")}>
                            {field.value || "เลือกจังหวัด"}
                          </span>
                        </Button>
                      }
                    >
                      <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 bg-white">
                        {provinces.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm font-medium">
                            ไม่มีข้อมูลจังหวัด
                          </div>
                        ) : (
                          provinces.map((p) => {
                            const isSelected = field.value === p.name_th;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(p.name_th);
                                  // Reset dependent fields when province changes in Step 1
                                  form.setValue("district", "");
                                  form.setValue("subdistrict", "");
                                  form.setValue("postal_code", "");
                                  form.setValue("popular_area", undefined);
                                  setProvinceOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] border text-left",
                                  isSelected
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                    : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                                )}
                              >
                                <span className="text-sm font-bold">{p.name_th}</span>
                                {isSelected && (
                                  <div className="bg-blue-600 rounded-full p-1 text-white">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </ResponsiveDialog>
                  ) : (
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
                        <SelectTrigger className="group rounded-2xl bg-white font-medium px-4 py-7 relative w-full border-slate-200 h-14 flex items-center gap-3 hover:border-slate-300 hover:bg-slate-50/50 transition-all">
                          <Flag className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
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
                  )}
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

                <div className="mt-auto w-full">
                  {isMobileOrTablet ? (
                    <ResponsiveDialog
                      open={areaOpen}
                      onOpenChange={setAreaOpen}
                      title="เลือกย่าน / ทำเล"
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className="group rounded-2xl bg-white font-medium px-4 py-7 relative w-full border-slate-200 justify-start h-14 flex items-center gap-3 hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                        >
                          <MapPin className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                          <span className={cn("font-medium transition-colors", field.value ? "text-slate-800 group-hover:text-slate-900" : "text-slate-400 group-hover:text-slate-500")}>
                            {field.value || "เลือกย่าน / ทำเล"}
                          </span>
                        </Button>
                      }
                    >
                      <div className="p-4 max-h-[60vh] overflow-y-auto bg-white flex flex-col gap-3">
                        <div className="relative flex items-center">
                          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="ค้นหาย่าน / ทำเล..."
                            value={areaSearchQuery}
                            onChange={(e) => setAreaSearchQuery(e.target.value)}
                            onKeyDown={(e) => handleAreaKeyDown(e, field, true)}
                            className="pl-10 pr-4 py-2 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-2 overflow-y-auto pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(undefined);
                              setAreaOpen(false);
                            }}
                            data-highlighted={highlightedAreaIndex === 0 ? "true" : "false"}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] border text-left text-sm font-bold",
                              !field.value
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-400",
                              highlightedAreaIndex === 0 && "border-blue-500 ring-2 ring-blue-500/20 bg-slate-50 text-slate-700"
                            )}
                          >
                            <span>-- ไม่ระบุ --</span>
                            {!field.value && (
                              <div className="bg-blue-600 rounded-full p-1 text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                          
                          {sortedFilteredAreas.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-400">
                              ไม่พบย่านทำเล
                            </div>
                          ) : (
                            sortedFilteredAreas.map((a, i) => {
                              const isSelected = field.value === a;
                              const isHighlighted = highlightedAreaIndex === i + 1;
                              return (
                                  <button
                                    key={a}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(a);
                                      setAreaOpen(false);
                                    }}
                                    data-highlighted={isHighlighted ? "true" : "false"}
                                    className={cn(
                                      "w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] border text-left",
                                      isSelected
                                        ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700 hover:text-slate-900",
                                      isHighlighted && "border-blue-500 ring-2 ring-blue-500/20 bg-slate-50 text-slate-900"
                                    )}
                                  >
                                    <span className="text-sm font-bold">{a}</span>
                                    {isSelected && (
                                      <div className="bg-blue-600 rounded-full p-1 text-white">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </div>
                    </ResponsiveDialog>
                  ) : (
                    <Popover open={desktopAreaOpen} onOpenChange={setDesktopAreaOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id={field.name}
                          type="button"
                          variant="outline"
                          className="group rounded-2xl bg-white font-medium px-4 py-7 relative w-full border-slate-200 justify-start h-14 flex items-center gap-3 hover:border-slate-300 hover:bg-slate-50/50 transition-all focus:ring-2 focus:ring-blue-500"
                        >
                          <MapPin className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                          <span className={cn("font-medium transition-colors", field.value ? "text-slate-800 group-hover:text-slate-900" : "text-slate-400 group-hover:text-slate-500")}>
                            {field.value || "เลือกย่าน / ทำเล"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[350px] p-4 flex flex-col gap-3 overflow-hidden"
                        style={{ width: "var(--radix-popover-trigger-width)" }}
                        align="start"
                      >
                        <div className="relative flex items-center">
                          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="ค้นหาย่าน / ทำเล..."
                            value={areaSearchQuery}
                            onChange={(e) => setAreaSearchQuery(e.target.value)}
                            onKeyDown={(e) => handleAreaKeyDown(e, field, false)}
                            className="pl-10 pr-4 py-2 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(undefined);
                              setDesktopAreaOpen(false);
                            }}
                            data-highlighted={highlightedAreaIndex === 0 ? "true" : "false"}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] border text-left text-sm font-bold",
                              !field.value
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                : "bg-white border-transparent hover:bg-slate-50 text-slate-400",
                              highlightedAreaIndex === 0 && "border-blue-500 ring-2 ring-blue-500/20 bg-slate-50 text-slate-700"
                            )}
                          >
                            <span>-- ไม่ระบุ --</span>
                            {!field.value && (
                              <div className="bg-blue-600 rounded-full p-1 text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>

                          {sortedFilteredAreas.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-400">
                              ไม่พบย่านทำเล
                            </div>
                          ) : (
                            sortedFilteredAreas.map((a, i) => {
                                const isSelected = field.value === a;
                                const isHighlighted = highlightedAreaIndex === i + 1;
                                return (
                                  <button
                                    key={a}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(a);
                                      setDesktopAreaOpen(false);
                                    }}
                                    data-highlighted={isHighlighted ? "true" : "false"}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                      isSelected
                                        ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                        : "bg-white border-transparent hover:bg-slate-50 text-slate-700",
                                      isHighlighted && "border-blue-500 ring-2 ring-blue-500/20 bg-slate-50 text-slate-900"
                                    )}
                                  >
                                    <span className="text-sm font-semibold">{a}</span>
                                    {isSelected && (
                                      <div className="bg-blue-600 rounded-full p-0.5 text-white">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
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
                  <div className="flex items-center gap-2 ">
                    <label className="font-medium text-sm uppercase tracking-wider text-slate-700">
                      เพิ่มย่านใหม่ (Multi-language)
                    </label>
                  </div>
                  <div className="flex items-center gap-2 ">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTranslateArea}
                      disabled={isTranslatingArea}
                      className="h-8 text-indigo-700 bg-indigo-50/50 border-indigo-200/80 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-md hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] gap-1.5 transition-all duration-300 text-sm font-semibold rounded-lg px-3 group"
                    >
                      {isTranslatingArea ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-amber-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                      )}
                      AI ช่วยแปลชื่อย่าน
                    </Button>
                    <button
                    type="button"
                    onClick={() => setShowAddArea(false)}
                    className="text-slate-400 p-2 hover:bg-red-100 hover:text-red-600 rounded-sm transition-all"
                    >
                    <X className="h-4 w-4" />
                    </button>
                  </div>
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
                    onClick={async () => {
                      const success = await onAddAreaAction();
                      if (success) {
                        setShowAddArea(false);
                      }
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
