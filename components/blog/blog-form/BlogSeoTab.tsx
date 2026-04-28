"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostInput } from "@/features/blog/types";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Globe, Search, Sparkles, Languages, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlogRelatedSuggestions } from "./BlogRelatedSuggestions";

interface BlogSeoTabProps {
  form: UseFormReturn<BlogPostInput>;
  postId?: string;
}

export function BlogSeoTab({ form, postId }: BlogSeoTabProps) {
  const watchedTitle = form.watch("title");
  const watchedSlug = form.watch("slug");
  const watchedExcerpt = form.watch("excerpt");
  const watchedCategory = form.watch("category");
  const watchedTags = form.watch("tags") || "";

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Google Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">ตัวอย่างบน Google</h3>
              <p className="text-sm text-slate-500">ดูว่าบทความจะแสดงอย่างไรในผลการค้นหา</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer truncate font-medium">
                {watchedTitle || "หัวข้อบทความ"}
              </div>
              <div className="text-sm text-[#006621] truncate">
                https://yoursite.com/blog/{watchedSlug || "slug"}
              </div>
              <div className="text-sm text-[#545454] line-clamp-2">
                {watchedExcerpt || "กรุณาใส่ข้อความสรุปเพื่อดูตัวอย่างการแสดงผลบน Google"}
              </div>
            </div>
          </div>
        </div>

        {/* Meta Description */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Search className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Meta Description</h3>
              <p className="text-sm text-slate-500">ข้อความสรุปสำหรับ SEO</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">
                  ข้อความสรุป (ไทย)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="สรุปเนื้อหาบทความสั้นๆ (แนะนำ 150-160 ตัวอักษร)"
                    className="min-h-[100px] resize-none border-slate-200"
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormMessage />
                  <span
                    className={cn(
                      "text-xs",
                      (field.value?.length || 0) > 160 ? "text-red-500" : "text-slate-500"
                    )}
                  >
                    {field.value?.length || 0}/160
                  </span>
                </div>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <FormField
              control={form.control}
              name="excerpt_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> Excerpt (English)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[80px] resize-none border-slate-200 text-sm"
                      placeholder="English excerpt..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="excerpt_cn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> 文章摘要 (Chinese)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[80px] resize-none border-slate-200 text-sm"
                      placeholder="中文摘要..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="excerpt_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> Краткое описание (Russian)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[80px] resize-none border-slate-200 text-sm"
                      placeholder="Краткое описание на русском..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Structured Data */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Structured Data (JSON-LD)</h3>
                <p className="text-sm text-slate-500">ข้อมูล Schema.org สำหรับ SEO</p>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="structured_data"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder='{ "@context": "https://schema.org", ... }'
                    className="font-mono text-xs min-h-[200px] border-slate-200"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Analytics Insights */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">ตัวชี้วัดประสิทธิภาพ</h3>
              <p className="text-sm text-slate-500">สถานะล่าสุดของบทความ</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-100">
               <div className="flex items-center gap-2">
                 <TrendingUp className="h-4 w-4 text-green-600" />
                 <span className="text-xs font-bold text-slate-700">Views Success Ratio</span>
               </div>
               <span className="text-xs font-bold text-green-700">100%</span>
             </div>
             
             {/* Placeholder for future Analytics Chart */}
             <div className="h-32 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
                <p className="text-[10px] text-slate-400 text-center px-4 italic">
                  สถิติรายวันจะพร้อมใช้งานเมื่อมีการเก็บข้อมูล History ย้อนหลังครบ 7 วัน
                </p>
             </div>
          </div>
        </div>

        {/* Internal Linking Wizard */}
        <BlogRelatedSuggestions 
          currentPostId={postId}
          category={watchedCategory}
          tags={watchedTags}
        />
      </div>
    </div>
  );
}
