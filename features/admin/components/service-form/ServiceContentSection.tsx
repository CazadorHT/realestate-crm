"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Languages } from "lucide-react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const TiptapEditor = dynamic(() => import("@/components/blog/TiptapEditor").then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-md border border-slate-200" />
});

interface ServiceContentSectionProps {
  form: UseFormReturn<any>;
}

export function ServiceContentSection({ form }: ServiceContentSectionProps) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 py-4 bg-linear-to-r from-purple-50 to-pink-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">เนื้อหา</h3>
            <p className="text-xs text-slate-500">รายละเอียดและคำอธิบายบริการ</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">
                คำอธิบายสั้น (ไทย)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="อธิบายบริการแบบสั้นๆ 1-2 ประโยค..."
                  className="resize-none h-24 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-purple-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> Description (EN)
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    className="h-20 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm resize-none"
                    placeholder="English description..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description_cn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3 h-3" /> 服务简介 (CN)
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    className="h-20 rounded-xl bg-slate-50/30 border-slate-200 focus:bg-white transition-all text-sm resize-none"
                    placeholder="中文简介..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-medium">
                เนื้อหาเต็ม (ไทย)
              </FormLabel>
              <FormControl>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <ErrorBoundary>
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </ErrorBoundary>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Languages className="w-4 h-4" /> Content (English)
            </FormLabel>
            <FormField
              control={form.control}
              name="content_en"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <TiptapEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Languages className="w-4 h-4" /> 服务详情 (Chinese)
            </FormLabel>
            <FormField
              control={form.control}
              name="content_cn"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <TiptapEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
