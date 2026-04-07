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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TiptapEditor = dynamic(() => import("@/components/blog/TiptapEditor").then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-md border border-slate-200" />
});

import { ServiceFormValues } from "../ServiceForm";

interface ServiceContentSectionProps {
  form: UseFormReturn<ServiceFormValues>;
}

export function ServiceContentSection({ form }: ServiceContentSectionProps) {

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              การรังสรรค์เนื้อหา
            </h3>
            <p className="text-xs text-slate-500">
              รายละเอียดและกลยุทธ์บริการ
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  เนื้อหารายละเอียดบริการ (ภาษาไทย)
                </FormLabel>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-medium">
                  เนื้อหาหลัก
                </Badge>
              </div>
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

        <div className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              การจัดการเนื้อหาหลายภาษา
            </span>
          </div>

          <Tabs defaultValue="en" className="w-full">
            <TabsList className="bg-slate-100/50 p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-2">
              <TabsTrigger value="en" className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                English (EN)
              </TabsTrigger>
              <TabsTrigger value="cn" className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                Chinese (CN)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="mt-6 space-y-4 animate-in fade-in-50 duration-500">
              <div className="space-y-4">
                <FormLabel className="font-bold text-xs uppercase tracking-tight text-slate-500">
                  รายละเอียดบริการ (English)
                </FormLabel>
                <FormField
                  control={form.control}
                  name="content_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
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
            </TabsContent>

            <TabsContent value="cn" className="mt-6 space-y-4 animate-in fade-in-50 duration-500">
              <div className="space-y-4">
                <FormLabel className="font-bold text-xs uppercase tracking-tight text-slate-500">
                  รายละเอียดบริการ (Chinese - 详细描述)
                </FormLabel>
                <FormField
                  control={form.control}
                  name="content_cn"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
