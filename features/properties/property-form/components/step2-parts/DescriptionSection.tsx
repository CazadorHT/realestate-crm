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

export function DescriptionSection({
  form: formProp,
  isReadOnly,
}: DescriptionSectionProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const { isTranslating, translateDescription } = useAITranslation(form);

  const handleGenerate = useCallback(
    async (currentValue: string) => {
      const values = form.getValues() as PropertyFormValues;
      const isImproving =
        currentValue && currentValue !== "<p></p>" && currentValue.length > 50;
      const toastMessage = isImproving
        ? "AI กำลังช่วยปรับปรุงคำบรรยายให้สละสลวยยิ่งขึ้น..."
        : "AI กำลังแต่งคำบรรยายที่น่าสนใจให้คุณ...";

      const toastId = toast.loading(toastMessage);

      try {
        const html = await generateAIPropertyDescriptionAction(
          values,
          isImproving ? currentValue : undefined,
        );
        toast.success(
          isImproving
            ? "ปรับปรุงคำบรรยายเรียบร้อยแล้ว ✨"
            : "AI แต่งคำบรรยายเรียบร้อยแล้ว ✨",
          { id: toastId },
        );
        return html;
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
              title="คำบรรยายและรายละเอียด"
              desc="เขียนจุดเด่นที่น่าสนใจ เพื่อเพิ่มโอกาสในการขาย"
              tone="blue"
            />
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto" id="tour-property-ai-writer-translate">
              {isFeatureEnabled("ai_auto_description") && (
                <>
                  <AiWriterButton />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => translateDescription()}
                          disabled={isTranslating}
                          className="border-blue-100 text-blue-600! hover:bg-blue-50 gap-2 h-10 sm:h-9 px-4 rounded-xl shadow-sm w-full sm:w-auto justify-center font-medium"
                        >
                          {isTranslating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Languages className="h-4 w-4 text-blue-500" />
                          )}
                          AI แปลภาษาทั้งหมด 🌐
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white border-none shadow-xl px-4 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Languages className="w-3 h-3 text-blue-400" />
                          <span>แปลคำบรรยายจากภาษาไทยไปยังภาษาอื่นทั้งหมดโดยอัตโนมัติ 🌐</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col">
          <Tabs defaultValue="th" className="w-full flex-1 flex flex-col">
            <div className="px-4 sm:px-6 pt-4">
              <TabsList className="bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto grid grid-cols-4 sm:flex gap-1 h-[48px]">
                <TabsTrigger
                  value="th"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-th rounded-sm shadow-xs" />
                  ไทย
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-us rounded-sm shadow-xs" />
                  EN
                </TabsTrigger>
                <TabsTrigger
                  value="cn"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-cn rounded-sm shadow-xs" />
                  CN
                </TabsTrigger>
                <TabsTrigger
                  value="ru"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 gap-2"
                >
                  <span className="fi fi-ru rounded-sm shadow-xs" />
                  RU
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
                          placeholder={`เขียนรายละเอียดภาษาไทยที่นี่...`}
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
                        💡 เคล็ดลับ: ใช้ AI Writer
                        เพื่อช่วยแต่งคำบรรยายให้สละสลวยยิ่งขึ้น
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
