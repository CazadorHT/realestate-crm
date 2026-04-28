"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { FileText, Languages } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FAQFormValues } from "../FAQForm";

interface FAQAnswerSectionProps {
  form: UseFormReturn<FAQFormValues>;
}

export function FAQAnswerSection({ form }: FAQAnswerSectionProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <FormField
        control={form.control}
        name="answer"
        render={({ field }) => (
          <FormItem className="space-y-4 pt-2">
            <div className="flex items-center gap-2 px-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <FormLabel className="text-base font-semibold text-slate-900">
                สรุปคำตอบ (ภาษาไทย)
              </FormLabel>
            </div>
            <FormControl>
              <TipTapEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="อธิบายคำตอบอย่างละเอียดเพื่อให้ลูกค้าเข้าใจง่าย..."
                className="min-h-[220px]"
              />
            </FormControl>
            <FormMessage className="font-semibold text-xs ml-1" />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        <FormField
          control={form.control}
          name="answer_en"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="font-semibold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> Answer (English)
              </FormLabel>
              <FormControl>
                <TipTapEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Summary in English..."
                  className="min-h-[160px]"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer_cn"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="font-semibold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> 回答 (Chinese)
              </FormLabel>
              <FormControl>
                <TipTapEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="中文回答总结..."
                  className="min-h-[160px]"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer_ru"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="font-semibold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> Ответ (Russian)
              </FormLabel>
              <FormControl>
                <TipTapEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Ответ на русском..."
                  className="min-h-[160px]"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
