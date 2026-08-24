"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff, Save, Loader2, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { BlogPostInput } from "@/features/blog/types";
import { BlogAiGenerator } from "../BlogAiGenerator";
import { BlogContentRefiner } from "../BlogContentRefiner";
import { BlogJsonImportDialog } from "@/components/blog/blog-form/BlogJsonImportDialog";
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogHeaderProps {
  form: UseFormReturn<BlogPostInput>;
  isNew: boolean;
  isSubmitting: boolean;
  characterCount: number;
  onAiGenerated: (data: any) => void;
  importJsonOpen: boolean;
  setImportJsonOpen: (open: boolean) => void;
  jsonInput: string;
  setJsonInput: (input: string) => void;
  onImport: () => void;
  isTranslating: boolean;
  onTranslate: () => void;
}

export function BlogHeader({
  form,
  isNew,
  isSubmitting,
  characterCount,
  onAiGenerated,
  importJsonOpen,
  setImportJsonOpen,
  jsonInput,
  setJsonInput,
  onImport,
  isTranslating,
  onTranslate,
}: BlogHeaderProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();

  const watchedIsPublished = form.watch("is_published");
  const watchedTitle = form.watch("title");
  const watchedTitleEn = form.watch("title_en");
  const watchedTitleCn = form.watch("title_cn");
  const watchedTitleRu = form.watch("title_ru");

  const hasAnyTitle = Boolean(
    watchedTitle?.trim() ||
    watchedTitleEn?.trim() ||
    watchedTitleCn?.trim() ||
    watchedTitleRu?.trim()
  );

  return (
    <div className="sticky top-16 z-50 -mx-6 px-4 md:px-6 mb-6">
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 rounded-xl shadow-sm py-4 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left - Back & Title */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-slate-100 rounded-full shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
                  {isNew
                    ? (isEn ? "Create New Article" : "สร้างบทความใหม่")
                    : (isEn ? "Edit Article" : "แก้ไขบทความ")}
                </h1>
                {watchedIsPublished ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 text-[10px] md:text-xs">
                    <Eye className="h-3 w-3" />
                    <span className="hidden xs:inline">{isEn ? "Published" : "เผยแพร่แล้ว"}</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px] md:text-xs"
                  >
                    <EyeOff className="h-3 w-3" />
                    <span className="hidden xs:inline">{isEn ? "Draft" : "แบบร่าง"}</span>
                  </Badge>
                )}
              </div>
              <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 font-medium">
                {characterCount.toLocaleString()} {isEn ? "characters" : "ตัวอักษร"}
              </p>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex md:flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <BlogJsonImportDialog
                open={importJsonOpen}
                setOpen={setImportJsonOpen}
                jsonInput={jsonInput}
                setJsonInput={setJsonInput}
                onImport={onImport}
              />
            </div>

            {/* AI Blog Generator */}
            <BlogAiGenerator onGenerated={onAiGenerated} />

            {/* AI Content Refiner */}
            <div className="hidden lg:block">
              <BlogContentRefiner
                currentContent={form.watch("content") || form.watch("content_en") || ""}
                onRefined={(newContent) =>
                  form.setValue("content", newContent, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            {/* AI Translator */}
            <Button
              type="button"
              variant="outline"
              onClick={onTranslate}
              disabled={isTranslating || !hasAnyTitle}
              className="gap-2 border-violet-200 text-violet-700! hover:bg-violet-50 h-10 md:h-12 text-xs md:text-sm font-semibold cursor-pointer"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              ) : (
                <Languages className="h-4 w-4 text-violet-600" />
              )}
              {isTranslating 
                ? (isEn ? "Translating AI..." : "กำลังแปลภาษา...") 
                : (isEn ? "AI Translate All" : "แปลภาษาด้วย AI ทั้งหมด")}
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !hasAnyTitle ||
                characterCount === 0 ||
                !form.formState.isDirty
              }
              className="gap-2 bg-linear-to-r h-10 md:h-12 from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm cursor-pointer font-bold"
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

