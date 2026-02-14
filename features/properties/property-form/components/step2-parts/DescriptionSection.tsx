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
import { SmartEditor } from "../../components/SmartEditor";
import { FileText, Sparkles, Languages, Loader2 } from "lucide-react";
import { useAITranslation } from "../../hooks/use-ai-translation";
import { UseFormReturn } from "react-hook-form";
import { generateAIPropertyDescriptionAction } from "../../actions/ai-actions";
import { toast } from "sonner";
import { generatePropertyDescription } from "../../utils/description-generator";
import { PropertyFormValues } from "@/features/properties/schema";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/lib/features";

interface DescriptionSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
}

export function DescriptionSection({
  form,
  isReadOnly,
}: DescriptionSectionProps) {
  const { isTranslating, translateDescription } = useAITranslation(form);

  const handleGenerate = useCallback(
    async (currentValue: string) => {
      // Get all form values
      const values = form.getValues() as PropertyFormValues;

      // Check if we should "Generate" or "Improve"
      const isImproving =
        currentValue && currentValue !== "<p></p>" && currentValue.length > 50;
      const toastMessage = isImproving
        ? "AI กำลังช่วยปรับปรุงคำบรรยายให้สละสลวยยิ่งขึ้น..."
        : "AI กำลังแต่งคำบรรยายที่น่าสนใจให้คุณ...";

      // Show loading toast
      const toastId = toast.loading(toastMessage);

      try {
        // Try AI generation
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

        // Fallback to template generator
        const html = generatePropertyDescription(values);
        return html;
      }
    },
    [form],
  );

  return (
    <div className="space-y-6 lg:col-span-4">
      <Card className="border-slate-200/70 bg-white">
        <CardHeader className="space-y-3 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeader
              icon={FileText}
              title="รายละเอียด (ไทย)"
              desc="เขียนให้ขายง่าย: จุดเด่น, ใกล้อะไร, เฟอร์นิเจอร์, เงื่อนไข"
              tone="blue"
            />
            {isFeatureEnabled("ai_auto_description") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => translateDescription()}
                disabled={isTranslating}
                className="border-blue-100 text-blue-600 hover:bg-blue-50 gap-2 h-10 sm:h-9 px-4 rounded-xl shadow-sm w-full sm:w-auto justify-center"
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-500" />
                )}
                AI แปลเป็น EN/CN
              </Button>
            )}
          </div>
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent className="px-3 sm:px-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SmartEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isReadOnly}
                    placeholder={`ตัวอย่าง:\n• จุดเด่น: รีโนเวทใหม่ / วิวโล่ง / ใกล้ BTS\n• เฟอร์นิเจอร์/เครื่องใช้ไฟฟ้า: ...\n• เงื่อนไข: ...`}
                    onAiGenerate={
                      isFeatureEnabled("ai_auto_description")
                        ? handleGenerate
                        : undefined
                    }
                    height={
                      typeof window !== "undefined" && window.innerWidth < 640
                        ? 300
                        : 500
                    }
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  แนะนำใส่ “สิ่งที่ทำให้ต่างจากทรัพย์อื่น” 3–5 ข้อ
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Multilingual Descriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-slate-200/70 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <Languages className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-600 uppercase tracking-tight">
              Description (English)
            </span>
          </div>
          <CardContent className="p-3 sm:p-4">
            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SmartEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      height={
                        typeof window !== "undefined" && window.innerWidth < 640
                          ? 300
                          : 500
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <Languages className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-600 uppercase tracking-tight">
              物业详情 (Chinese)
            </span>
          </div>
          <CardContent className="p-3 sm:p-4">
            <FormField
              control={form.control}
              name="description_cn"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SmartEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      height={
                        typeof window !== "undefined" && window.innerWidth < 640
                          ? 300
                          : 500
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
