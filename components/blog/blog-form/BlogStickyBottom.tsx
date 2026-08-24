"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostInput } from "@/features/blog/types";
import { FormField } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { AiReviewBanner } from "@/components/shared/AiReviewBanner";
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogStickyBottomProps {
  form: UseFormReturn<BlogPostInput>;
  isSubmitting: boolean;
  characterCount: number;
}

export function BlogStickyBottom({
  form,
  isSubmitting,
  characterCount,
}: BlogStickyBottomProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();

  const watchedIsPublished = form.watch("is_published");
  const watchedTitle = form.watch("title");
  const watchedTitleEn = form.watch("title_en");
  const watchedTitleCn = form.watch("title_cn");
  const watchedTitleRu = form.watch("title_ru");
  const requiresAiReview = form.watch("requires_ai_review");

  const hasAnyTitle = Boolean(
    watchedTitle?.trim() ||
    watchedTitleEn?.trim() ||
    watchedTitleCn?.trim() ||
    watchedTitleRu?.trim()
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-max md:min-w-[600px] lg:min-w-6xl max-w-6xl px-4 flex flex-col gap-3">
      {requiresAiReview && (
        <AiReviewBanner
          type="blog"
          onConfirm={() => form.setValue("requires_ai_review", false, { shouldDirty: true })}
          isVerifying={isSubmitting}
          className="mb-0 rounded-2xl border border-amber-200/60 shadow-xl overflow-hidden"
        />
      )}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl py-3 md:py-4 px-6 md:px-10 flex items-center justify-center lg:justify-between gap-6">
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
          <span className="hidden md:inline font-medium">
            {watchedIsPublished
              ? (isEn ? "Status: Published" : "สถานะ: เผยแพร่แล้ว")
              : (isEn ? "Status: Draft" : "สถานะ: ฉบับร่าง")}
          </span>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <span className="font-medium">
            {(characterCount || 0).toLocaleString()} {isEn ? "characters" : "ตัวอักษร"}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 justify-center lg:justify-end">
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 h-10 md:h-12 overflow-hidden border border-transparent hover:border-slate-200 transition-colors">
                <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-tight">
                  {field.value 
                    ? (isEn ? "Published" : "เผยแพร่") 
                    : (isEn ? "Draft" : "ฉบับร่าง")}
                </span>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  className="h-5 w-9 data-[state=checked]:bg-blue-600 scale-75 md:scale-90"
                />
              </div>
            )}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-slate-100 h-10 md:h-12 px-2 md:px-4 text-xs md:text-sm cursor-pointer"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !hasAnyTitle ||
                characterCount === 0 ||
                !form.formState.isDirty
              }
              className="gap-2 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-green-500/25 min-w-[80px] md:min-w-[120px] h-10 md:h-12 text-xs md:text-sm cursor-pointer font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEn ? "Save" : "บันทึก"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

