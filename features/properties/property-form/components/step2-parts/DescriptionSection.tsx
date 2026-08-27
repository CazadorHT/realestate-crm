"use client";

import React, { useCallback } from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import dynamic from "next/dynamic";
import { FileText, Sparkles, Languages, Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const SmartEditor = dynamic(
  () => import("../../components/SmartEditor").then((mod) => mod.SmartEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[850px] w-full bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
    ),
  },
);
import { useAITranslation } from "../../hooks/use-ai-translation";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import { generateAIPropertyDescriptionAction } from "../../actions/ai-actions";
import { toast } from "sonner";
import { generatePropertyDescription } from "../../utils/description-generator";
import { PropertyFormValues } from "@/features/properties/schema";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/lib/features";
import { AiWriterButton } from "../../components/AiWriterButton";

interface DescriptionSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  isReadOnly: boolean;
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/components/providers/LanguageProvider";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCw, Zap } from "lucide-react";

export function DescriptionSection({
  form: formProp,
  isReadOnly,
}: DescriptionSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const { isTranslating, translateDescription } = useAITranslation(form);

  const [activeTab, setActiveTab] = React.useState<"th" | "en" | "cn" | "ru">("th");

  const descTh = form.watch("description");
  const descEn = form.watch("description_en");
  const descCn = form.watch("description_cn");
  const descRu = form.watch("description_ru");

  const isContentNonEmpty = (val: any) =>
    typeof val === "string" && val.trim() !== "" && val !== "<p></p>";

  const hasTh = isContentNonEmpty(descTh);
  const hasEn = isContentNonEmpty(descEn);
  const hasCn = isContentNonEmpty(descCn);
  const hasRu = isContentNonEmpty(descRu);

  const emptyLangs = [
    !hasTh && "TH",
    !hasEn && "EN",
    !hasCn && "CN",
    !hasRu && "RU",
  ].filter(Boolean) as string[];

  const handleSmartTranslate = () => {
    if (emptyLangs.length > 0) {
      // Smart Fill: Only translate missing empty languages!
      translateDescription({ sourceLang: activeTab, silent: false });
    } else {
      // If all are filled, re-translate from active tab
      translateDescription({ sourceLang: activeTab, forceAll: true, silent: false });
    }
  };

  const handleGenerate = useCallback(
    async (currentValue: string): Promise<string> => {
      const values = form.getValues() as PropertyFormValues;
      const cleanText = currentValue ? currentValue.replace(/<[^>]*>/g, "").trim() : "";
      const isImproving = cleanText.length > 0;
      
      const toastMessage = isImproving
        ? "AI กำลังนำคำบรรยายเดิมมาเกลาเนื้อหาและปรับปรุงให้สละสลวยยิ่งขึ้น..."
        : "AI กำลังแต่งคำบรรยายที่น่าสนใจให้คุณ...";

      const toastId = toast.loading(toastMessage);

      try {
        const html = await generateAIPropertyDescriptionAction(
          values,
          isImproving ? currentValue : undefined,
        );
        toast.success(
          isImproving
            ? "เกลาและปรับปรุงคำบรรยายเรียบร้อยแล้ว ✨"
            : "AI แต่งคำบรรยายเรียบร้อยแล้ว ✨",
          { id: toastId },
        );
        return html ?? "";
      } catch (error) {
        console.error("AI Generation failed, falling back to template:", error);
        toast.error("AI ไม่พร้อมใช้งานในขณะนี้ กำลังใช้ระบบ Template แทน", {
          id: toastId,
        });
        const html = generatePropertyDescription(values);
        return html;
      }
    },
    [form],
  );

  return (
    <div className="lg:col-span-4 flex flex-col">
      <Card className="border-slate-200/70 bg-white shadow-md overflow-hidden rounded-xl flex flex-col flex-1">
        <CardHeader className="space-y-3 px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeader
              icon={FileText}
              title={isEn ? "Description & Details" : "คำบรรยายและรายละเอียด"}
              desc={isEn ? "Highlight key features to attract prospective buyers & tenants" : "เขียนจุดเด่นที่น่าสนใจ เพื่อเพิ่มโอกาสในการขาย"}
              tone="blue"
            />
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto" id="tour-property-ai-writer-translate">
              {isFeatureEnabled("ai_auto_description") && (
                <>
                  <AiWriterButton />
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSmartTranslate}
                            disabled={isTranslating}
                            className="border-blue-200 text-blue-600! hover:bg-blue-50 gap-2 h-10 sm:h-9 px-3.5 rounded-l-xl rounded-r-none shadow-sm flex-1 sm:flex-initial justify-center font-semibold"
                          >
                            {isTranslating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Languages className="h-4 w-4 text-blue-500" />
                            )}
                            <span>
                              {emptyLangs.length > 0
                                ? isEn
                                  ? `AI Fill (${emptyLangs.join(", ")})`
                                  : `AI แปลภาษาที่เหลือ (${emptyLangs.join(", ")})`
                                : isEn
                                ? "AI Translate All"
                                : "AI แปลใหม่ทุกภาษา"}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none shadow-xl px-4 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Languages className="w-3 h-3 text-blue-400" />
                            <span>
                              {emptyLangs.length > 0
                                ? isEn
                                  ? `Smartly translates only missing languages (${emptyLangs.join(", ")}) while keeping current content 🌐`
                                  : `แปลเฉพาะภาษาที่ยังว่างอยู่ (${emptyLangs.join(", ")}) โดยไม่แตะต้องเนื้อหาเดิมที่เขียนไว้ 🌐`
                                : isEn
                                ? "Translates to all other languages from active tab 🌐"
                                : "แปลคำบรรยายใหม่ทุกภาษาจากแท็บปัจจุบัน 🌐"}
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Translation Dropdown Options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isTranslating}
                          className="border-l-0 border-blue-200 text-blue-600! hover:bg-blue-50 h-10 sm:h-9 px-2 rounded-r-xl rounded-l-none shadow-sm"
                          title={isEn ? "More translation options" : "ตัวเลือกการแปลเพิ่มเติม"}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-xl">
                        <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
                          {isEn ? "Translation Mode" : "โหมดการแปลภาษา"}
                        </DropdownMenuLabel>
                        
                        <DropdownMenuItem
                          onClick={() => translateDescription({ sourceLang: activeTab, silent: false })}
                          className="rounded-lg gap-2.5 py-2 cursor-pointer"
                        >
                          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">
                              {isEn ? "Fill Missing Only" : "แปลเฉพาะภาษาที่ยังว่าง"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {emptyLangs.length > 0
                                ? `(${emptyLangs.join(", ")})`
                                : isEn
                                ? "All languages filled"
                                : "กรอกครบทุกภาษาแล้ว"}
                            </span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => translateDescription({ sourceLang: activeTab, forceAll: true, silent: false })}
                          className="rounded-lg gap-2.5 py-2 cursor-pointer"
                        >
                          <RefreshCw className="h-4 w-4 text-blue-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">
                              {isEn ? `Re-translate All (from ${activeTab.toUpperCase()})` : `แปลใหม่ทุกภาษา (จากแท็บ ${activeTab.toUpperCase()})`}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {isEn ? "Overwrites EN, CN, RU" : "เขียนทับภาษาอื่นทั้งหมด"}
                            </span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 px-2 py-0.5">
                          {isEn ? "Translate Single Language" : "แปลเฉพาะภาษานี้"}
                        </DropdownMenuLabel>

                        <DropdownMenuItem
                          onClick={() => translateDescription({ sourceLang: activeTab, targetLanguages: ["en"], silent: false })}
                          className="rounded-lg gap-2 py-1.5 cursor-pointer text-xs"
                        >
                          <span className="fi fi-us rounded-xs" />
                          <span>{isEn ? "Translate English (EN) only" : "แปลเฉพาะภาษาอังกฤษ (EN)"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => translateDescription({ sourceLang: activeTab, targetLanguages: ["cn"], silent: false })}
                          className="rounded-lg gap-2 py-1.5 cursor-pointer text-xs"
                        >
                          <span className="fi fi-cn rounded-xs" />
                          <span>{isEn ? "Translate Chinese (CN) only" : "แปลเฉพาะภาษาจีน (CN)"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => translateDescription({ sourceLang: activeTab, targetLanguages: ["ru"], silent: false })}
                          className="rounded-lg gap-2 py-1.5 cursor-pointer text-xs"
                        >
                          <span className="fi fi-ru rounded-xs" />
                          <span>{isEn ? "Translate Russian (RU) only" : "แปลเฉพาะภาษารัสเซีย (RU)"}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => translateDescription({ sourceLang: activeTab, targetLanguages: ["th"], silent: false })}
                          className="rounded-lg gap-2 py-1.5 cursor-pointer text-xs"
                        >
                          <span className="fi fi-th rounded-xs" />
                          <span>{isEn ? "Translate Thai (TH) only" : "แปลเฉพาะภาษาไทย (TH)"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full flex-1 flex flex-col"
          >
            <div className="px-4 sm:px-6 pt-4">
              <TabsList className="bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto grid grid-cols-4 sm:flex gap-1 h-[48px]">
                <TabsTrigger
                  value="th"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-th rounded-sm shadow-xs" />
                  <span>{isEn ? "TH" : "ไทย"}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-us rounded-sm shadow-xs" />
                  <span>EN</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cn"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-cn rounded-sm shadow-xs" />
                  <span>CN</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ru"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-ru rounded-sm shadow-xs" />
                  <span>RU</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="th"
              className="mt-0 p-4 sm:p-6 focus-visible:ring-0 flex-1 flex flex-col"
            >
              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormControl className="flex-1 flex flex-col">
                      <ErrorBoundary>
                        <SmartEditor
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          disabled={isReadOnly}
                          placeholder={isEn ? "Write description in Thai here..." : "เขียนรายละเอียดภาษาไทยที่นี่..."}
                          onAiGenerate={
                            isFeatureEnabled("ai_auto_description")
                              ? handleGenerate
                              : undefined
                          }
                          onAiApply={() =>
                            form.setValue("requires_ai_review", true, {
                              shouldDirty: true,
                            })
                          }
                          height="100%"
                        />
                      </ErrorBoundary>
                    </FormControl>
                    {fieldState.error ? (
                      <FormMessage className="text-xs text-red-500 mt-2" />
                    ) : (
                      <FormDescription className="text-xs text-slate-500 mt-2">
                        {isEn
                          ? "💡 Pro-Tip: Use AI Writer to compose compelling and professional property descriptions."
                          : "💡 เคล็ดลับ: ใช้ AI Writer เพื่อช่วยแต่งคำบรรยายให้สละสลวยยิ่งขึ้น"}
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent
              value="en"
              className="mt-0 p-4 sm:p-6 focus-visible:ring-0 flex-1 flex flex-col"
            >
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormControl className="flex-1 flex flex-col">
                      <SmartEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        height="100%"
                        placeholder="Description in English..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent
              value="cn"
              className="mt-0 p-4 sm:p-6 focus-visible:ring-0 flex-1 flex flex-col"
            >
              <FormField
                control={form.control}
                name="description_cn"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormControl className="flex-1 flex flex-col">
                      <SmartEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        height="100%"
                        placeholder="物业详情 (Chinese)..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent
              value="ru"
              className="mt-0 p-4 sm:p-6 focus-visible:ring-0 flex-1 flex flex-col"
            >
              <FormField
                control={form.control}
                name="description_ru"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormControl className="flex-1 flex flex-col">
                      <SmartEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        height="100%"
                        placeholder="Описание (Russian)..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
