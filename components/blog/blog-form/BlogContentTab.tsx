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

const TiptapEditor = dynamic(() => import("../TiptapEditor").then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-md border border-input" />
});

interface BlogContentTabProps {
  form: UseFormReturn<BlogPostInput>;
  isTranslating: boolean;
  onTranslate: () => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRegenerateSlug: () => void;
}

export function BlogContentTab({
  form,
  isTranslating,
  onTranslate,
  onTitleChange,
  onRegenerateSlug,
}: BlogContentTabProps) {
  return (
    <div className="space-y-6">
      {/* Title & Slug Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Type className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">ข้อมูลพื้นฐาน</h3>
            <p className="text-sm text-slate-500">หัวข้อและ URL ของบทความ</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-slate-700 font-medium">
                  หัวข้อบทความ (ไทย) <span className="text-red-500">*</span>
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onTranslate}
                  disabled={isTranslating}
                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 transition-all text-xs"
                >
                  {isTranslating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  AI แปลทุกส่วนเป็น EN/CN/RU
                </Button>
              </div>
              <FormControl>
                <Input
                  placeholder="เขียนหัวข้อที่น่าสนใจ..."
                  className="text-lg font-medium h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> Title (English)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                    placeholder="English title..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_cn"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> 文章标题 (Chinese)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                    placeholder="中文标题..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_ru"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> Заголовок (Russian)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                    placeholder="Заголовок на русском..."
                  />
                </FormControl>
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
                  <Link2 className="h-4 w-4" />
                  URL Slug <span className="text-red-500">*</span>
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerateSlug}
                  className="h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1 text-[10px] font-bold"
                >
                  <Sparkles className="h-3 w-3" />
                  Magic Slug
                </Button>
              </div>
              <FormControl>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
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
                URL จะถูกสร้างอัตโนมัติจากหัวข้อ หรือกดปุ่ม <b>Magic Slug</b> เพื่อให้ AI ช่วยปรับแต่งให้สวยงาม
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
              <h3 className="font-semibold text-slate-900">เนื้อหาบทความ</h3>
              <p className="text-sm text-slate-500">เขียนเนื้อหาด้วย Rich Text Editor แยกตามภาษา</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="th" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-slate-50 p-1 h-auto rounded-xl border border-slate-100">
            <TabsTrigger value="th" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="text-lg">🇹🇭</span>
              <span className="text-xs md:text-sm font-medium">ภาษาไทย</span>
            </TabsTrigger>
            <TabsTrigger value="en" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="text-lg">🇬🇧</span>
              <span className="text-xs md:text-sm font-medium">English</span>
            </TabsTrigger>
            <TabsTrigger value="cn" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="text-lg">🇨🇳</span>
              <span className="text-xs md:text-sm font-medium">Chinese</span>
            </TabsTrigger>
            <TabsTrigger value="ru" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span className="text-lg">🇷🇺</span>
              <span className="text-xs md:text-sm font-medium">Russian</span>
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
