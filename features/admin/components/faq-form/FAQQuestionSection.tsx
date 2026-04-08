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
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FormField
        control={form.control}
        name="question"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-1">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <FormLabel className="text-base font-black text-slate-900">
                  คำถามหลัก (ภาษาไทย)
                </FormLabel>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onTranslate}
                disabled={isTranslating}
                className="h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 transition-all text-xs font-bold rounded-xl border border-transparent hover:border-blue-100 px-4"
              >
                {isTranslating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                )}
                แปลหลายภาษาอัตโนมัติ
              </Button>
            </div>
            <FormControl>
              <Input
                placeholder="ระบุคำถามหลักที่ลูกค้ามักจะถามบ่อยๆ..."
                className="h-16 text-lg border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:font-normal rounded-2xl bg-slate-50/50"
                {...field}
              />
            </FormControl>
            <FormMessage className="font-bold text-xs ml-1" />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
        <FormField
          control={form.control}
          name="question_en"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> Question (English)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all text-sm font-medium"
                  placeholder="English version..."
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="question_cn"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2">
                <Languages className="w-3 h-3" /> 常见问题 (Chinese)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all text-sm font-medium"
                  placeholder="中文翻译..."
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
