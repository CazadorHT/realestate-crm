"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostInput } from "@/features/blog/types";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Type, Sparkles, Loader2, Languages, Link2 } from "lucide-react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n/language-context";

const TiptapEditor = dynamic(() => import("../TiptapEditor").then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-md border border-input" />
});

interface BlogContentTabProps {
  form: UseFormReturn<BlogPostInput>;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleEnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRegenerateSlug: () => void;
  isTranslating: boolean;
  onTranslateContentOnly: () => void;
}

export function BlogContentTab({
  form,
  onTitleChange,
  onTitleEnChange,
  onRegenerateSlug,
  isTranslating,
  onTranslateContentOnly,
}: BlogContentTabProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-6">
      {/* Title & Slug Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Type className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {isEn ? "Basic Details" : "ข้อมูลพื้นฐาน"}
            </h3>
            <p className="text-sm text-slate-500">
              {isEn ? "Article title and URL slug" : "หัวข้อและ URL ของบทความ"}
            </p>
          </div>
        </div>

        {/* 2x2 Title Grid (Thai paired with English on top, Chinese & Russian below) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Thai Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-semibold text-xs text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🇹🇭</span>
                    {isEn ? "Title (Thai)" : "หัวข้อบทความ (ไทย)"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Primary / Fallback</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={isEn ? "Write Thai title..." : "เขียนหัวข้อภาษาไทย..."}
                    className="h-11 rounded-xl bg-slate-50/60 border-slate-200 focus:bg-white transition-all text-sm font-medium"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onTitleChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* English Title */}
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-semibold text-xs text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🇬🇧</span>
                    {isEn ? "Title (English)" : "หัวข้อบทความ (อังกฤษ)"}
                  </span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">SEO Slug</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-11 rounded-xl bg-slate-50/60 border-slate-200 focus:bg-white transition-all text-sm font-medium"
                    placeholder={isEn ? "English title (used for URL slug)..." : "หัวข้อภาษาอังกฤษ (ใช้สร้าง URL slug)..."}
                    onChange={(e) => {
                      field.onChange(e);
                      onTitleEnChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Chinese Title */}
          <FormField
            control={form.control}
            name="title_cn"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                  <span className="text-base">🇨🇳</span>
                  {isEn ? "Title (Chinese)" : "文章标题 (จีน)"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-11 rounded-xl bg-slate-50/60 border-slate-200 focus:bg-white transition-all text-sm font-medium"
                    placeholder={isEn ? "Chinese title..." : "中文标题..."}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Russian Title */}
          <FormField
            control={form.control}
            name="title_ru"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                  <span className="text-base">🇷🇺</span>
                  {isEn ? "Title (Russian)" : "Заголовок (รัสเซีย)"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-11 rounded-xl bg-slate-50/60 border-slate-200 focus:bg-white transition-all text-sm font-medium"
                    placeholder={isEn ? "Russian title..." : "Заголовок на русском..."}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  URL Slug <span className="text-red-500">*</span>
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerateSlug}
                  className="h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1 text-[10px] font-bold cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Magic Slug
                </Button>
              </div>
              <FormControl>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono">
                    /blog/
                  </span>
                  <Input
                    {...field}
                    className="rounded-l-none font-mono text-sm border-slate-200"
                    placeholder="post-url-slug"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs text-slate-500">
                {isEn 
                  ? <>URL is automatically generated from <b>English title</b> or click <b>Magic Slug</b> to regenerate</>
                  : <>URL สร้างอัตโนมัติจาก <b>English title</b> หรือกด <b>Magic Slug</b> เพื่อสร้างใหม่อัตโนมัติ</>}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Content Editor with Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Type className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {isEn ? "Article Content" : "เนื้อหาบทความ"}
              </h3>
              <p className="text-sm text-slate-500">
                {isEn ? "Write rich-text content separated by language" : "เขียนเนื้อหาด้วย Rich Text Editor แยกตามภาษา"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTranslateContentOnly}
            disabled={
              isTranslating ||
              !(
                form.watch("content")?.trim() ||
                form.watch("content_en")?.trim() ||
                form.watch("content_cn")?.trim() ||
                form.watch("content_ru")?.trim()
              )
            }
            className="self-start md:self-center gap-1.5 border-purple-200 text-purple-700! hover:bg-purple-50 h-9 text-xs font-semibold cursor-pointer"
          >
            {isTranslating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
            ) : (
              <Languages className="h-3.5 w-3.5 text-purple-600" />
            )}
            {isEn ? "Translate Content (AI)" : "แปลเฉพาะเนื้อหาส่วนนี้"}
          </Button>
        </div>

        <Tabs defaultValue="th" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-slate-50 p-1 h-auto rounded-xl border border-slate-100">
            <TabsTrigger value="th" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <span className="text-lg">🇹🇭</span>
              <span className="text-xs md:text-sm font-medium">{isEn ? "Thai" : "ภาษาไทย"}</span>
            </TabsTrigger>
            <TabsTrigger value="en" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <span className="text-lg">🇬🇧</span>
              <span className="text-xs md:text-sm font-medium">English</span>
            </TabsTrigger>
            <TabsTrigger value="cn" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <span className="text-lg">🇨🇳</span>
              <span className="text-xs md:text-sm font-medium">{isEn ? "Chinese" : "中文 (จีน)"}</span>
            </TabsTrigger>
            <TabsTrigger value="ru" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <span className="text-lg">🇷🇺</span>
              <span className="text-xs md:text-sm font-medium">{isEn ? "Russian" : "Русский (รัสเซีย)"}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="th" className="mt-0 focus-visible:outline-none">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ErrorBoundary>
                      <TiptapEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </ErrorBoundary>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="en" className="mt-0 focus-visible:outline-none">
            <FormField
              control={form.control}
              name="content_en"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="cn" className="mt-0 focus-visible:outline-none">
            <FormField
              control={form.control}
              name="content_cn"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="ru" className="mt-0 focus-visible:outline-none">
            <FormField
              control={form.control}
              name="content_ru"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
