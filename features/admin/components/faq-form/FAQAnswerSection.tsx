"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
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
              <FormLabel className="text-base font-black text-slate-900">
                สรุปคำตอบ (ภาษาไทย)
              </FormLabel>
            </div>
            <FormControl>
              <Textarea
                placeholder="อธิบายคำตอบอย่างละเอียดเพื่อให้ลูกค้าเข้าใจง่าย..."
                className="min-h-[200px] text-lg border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none rounded-2xl bg-slate-50/50 p-6 leading-relaxed font-medium"
                {...field}
              />
            </FormControl>
            <FormMessage className="font-bold text-xs ml-1" />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        <FormField
          control={form.control}
          name="answer_en"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> Answer (English)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  className="min-h-[140px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-400/5 transition-all text-sm resize-none font-medium p-5 leading-relaxed"
                  placeholder="Summary in English..."
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer_cn"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> 回答 (Chinese)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  className="min-h-[140px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-400/5 transition-all text-sm resize-none font-medium p-5 leading-relaxed"
                  placeholder="中文回答总结..."
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
