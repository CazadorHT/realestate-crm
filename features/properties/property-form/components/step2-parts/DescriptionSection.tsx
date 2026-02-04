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
import { FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { generateAIPropertyDescriptionAction } from "../../actions/ai-actions";
import { toast } from "sonner";
import { generatePropertyDescription } from "../../utils/description-generator";
import { PropertyFormValues } from "@/features/properties/schema";

interface DescriptionSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
}

export function DescriptionSection({
  form,
  isReadOnly,
}: DescriptionSectionProps) {
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
    <Card className="lg:col-span-2 border-slate-200/70 bg-white">
      <CardHeader className="space-y-3">
        <SectionHeader
          icon={FileText}
          title="รายละเอียด"
          desc="เขียนให้ขายง่าย: จุดเด่น, ใกล้อะไร, เฟอร์นิเจอร์, เงื่อนไข"
          tone="blue"
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent>
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
                  onAiGenerate={handleGenerate}
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
  );
}
