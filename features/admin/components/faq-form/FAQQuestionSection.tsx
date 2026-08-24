"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Languages, Loader2, Sparkles } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FAQFormValues } from "../FAQForm";
import { useLanguage } from "@/lib/i18n/language-context";

interface FAQQuestionSectionProps {
  form: UseFormReturn<FAQFormValues>;
  isTranslating: boolean;
  onTranslate: () => void;
}

export function FAQQuestionSection({
  form,
  isTranslating,
  onTranslate,
}: FAQQuestionSectionProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">
            {isEn ? "2x2 Multilingual Questions" : "คำถามแยกตามภาษา (2x2 Multilingual Questions)"}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onTranslate}
          disabled={isTranslating}
          className="h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 transition-all text-xs font-semibold rounded-xl border border-blue-100 hover:border-blue-200 px-4 cursor-pointer"
        >
          {isTranslating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          )}
          {isEn ? "Translate All with AI" : "แปลภาษาทั้งหมดด้วย AI"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* THAI */}
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem className="space-y-2 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-th h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Question (Thai)" : "คำถาม (ภาษาไทย)"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={isEn ? "Enter question in Thai..." : "ระบุคำถามหลักภาษาไทย..."}
                  className="h-11 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium rounded-xl text-sm"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />

        {/* ENGLISH */}
        <FormField
          control={form.control}
          name="question_en"
          render={({ field }) => (
            <FormItem className="space-y-2 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-us h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Question (English)" : "คำถาม (ภาษาอังกฤษ)"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-11 rounded-xl bg-white border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all text-sm font-medium"
                  placeholder="Enter question in English..."
                />
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />

        {/* CHINESE */}
        <FormField
          control={form.control}
          name="question_cn"
          render={({ field }) => (
            <FormItem className="space-y-2 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-cn h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Question (Chinese)" : "常见问题 (ภาษาจีน)"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-11 rounded-xl bg-white border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all text-sm font-medium"
                  placeholder="中文问题..."
                />
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />

        {/* RUSSIAN */}
        <FormField
          control={form.control}
          name="question_ru"
          render={({ field }) => (
            <FormItem className="space-y-2 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-ru h-3 w-4 rounded-xs shadow-xs" />
                {isEn ? "Question (Russian)" : "Вопрос (ภาษารัสเซีย)"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-11 rounded-xl bg-white border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all text-sm font-medium"
                  placeholder="Вопрос на русском..."
                />
              </FormControl>
              <FormMessage className="font-semibold text-xs ml-1" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

