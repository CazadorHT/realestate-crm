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
import { useLanguage } from "@/lib/i18n/language-context";

interface FAQAnswerSectionProps {
  form: UseFormReturn<FAQFormValues>;
}

export function FAQAnswerSection({ form }: FAQAnswerSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-800">
          {isEn ? "2x2 Multilingual Answers" : "คำตอบแยกตามภาษา (2x2 Multilingual Answers)"}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* THAI */}
        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem className="space-y-3 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-th h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Answer (Thai)" : "คำตอบ (ภาษาไทย)"}
              </FormLabel>
              <FormControl>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <TipTapEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={isEn ? "Detailed answer in Thai..." : "อธิบายคำตอบภาษาไทย..."}
                    className="min-h-[160px]"
                  />
                </div>
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />

        {/* ENGLISH */}
        <FormField
          control={form.control}
          name="answer_en"
          render={({ field }) => (
            <FormItem className="space-y-3 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-us h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Answer (English)" : "คำตอบ (ภาษาอังกฤษ)"}
              </FormLabel>
              <FormControl>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <TipTapEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={isEn ? "Detailed answer in English..." : "Summary in English..."}
                    className="min-h-[160px]"
                  />
                </div>
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />

        {/* CHINESE */}
        <FormField
          control={form.control}
          name="answer_cn"
          render={({ field }) => (
            <FormItem className="space-y-3 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-cn h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Answer (Chinese)" : "回答 (ภาษาจีน)"}
              </FormLabel>
              <FormControl>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <TipTapEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="中文回答总结..."
                    className="min-h-[160px]"
                  />
                </div>
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />

        {/* RUSSIAN */}
        <FormField
          control={form.control}
          name="answer_ru"
          render={({ field }) => (
            <FormItem className="space-y-3 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-ru h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Answer (Russian)" : "Ответ (ภาษารัสเซีย)"}
              </FormLabel>
              <FormControl>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <TipTapEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Ответ на русском..."
                    className="min-h-[160px]"
                  />
                </div>
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

